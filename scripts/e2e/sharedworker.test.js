const { chromium } = require('playwright');

function makeId(prefix='id'){
  return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2,8);
}

(async ()=>{
  console.log('🧪 Starting E2E SharedWorker test...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const pageA = await context.newPage();
  const pageB = await context.newPage();

  pageA.on('console', msg => console.log(`  [PageA] ${msg.text()}`));
  pageB.on('console', msg => console.log(`  [PageB] ${msg.text()}`));
  pageA.on('error', err => console.error('  [PageA ERROR]', err));
  pageB.on('error', err => console.error('  [PageB ERROR]', err));

  try {
    console.log('📄 Loading test pages...');
    await pageA.goto('http://localhost:3000/sw-test.html', { waitUntil: 'domcontentloaded' });
    await pageB.goto('http://localhost:3000/sw-test.html', { waitUntil: 'domcontentloaded' });

    console.log('⚙️  Setting up Page A (subscriber)...');
    const subId = makeId('sub');
    await pageA.evaluate(({subId}) => {
      window.__subs = [];
      window._worker = new SharedWorker('/e2e-worker.js');
      window._port = window._worker.port;
      window._port.start();
      window._port.onmessage = (e) => {
        if(e.data.kind === 'subscription'){
          window.__subs.push(e.data.documents);
          console.log('Received subscription with', e.data.documents.length, 'docs');
        }
        window._lastMsg = e.data;
      };
      window._port.postMessage({ kind: 'init', appId: 'e2e', config: { appId: 'e2e' } });
    }, { subId });

    // Wait for init
    await new Promise(r => setTimeout(r, 500));

    console.log('✉️  Sending subscribe from Page A...');
    await pageA.evaluate(({subId}) => {
      window._port.postMessage({ kind: 'subscribe', id: subId, appId: 'e2e', collectionName: 'shared' });
    }, { subId });

    await new Promise(r => setTimeout(r, 300));

    console.log('⚙️  Setting up Page B (inserter)...');
    const reqId = makeId('r');
    await pageB.evaluate(({reqId}) => {
      window._worker = new SharedWorker('/e2e-worker.js');
      window._port = window._worker.port;
      window._port.start();
      window._port.onmessage = (e) => {
        window._lastMsg = e.data;
        if (e.data.kind === 'response' && e.data.id === reqId) {
          console.log('Insert confirmed');
        }
      };
      window._port.postMessage({ kind: 'init', appId: 'e2e', config: {} });
      
      window._port.addEventListener('message', function handler(evt){
        if(evt.data?.kind === 'response' && evt.data.id === 'init'){
          console.log('Sending insert request...');
          window._port.postMessage({ 
            kind: 'request', 
            id: reqId, 
            appId: 'e2e', 
            scope: 'collection', 
            collectionName: 'shared', 
            method: 'insert', 
            args: [{ title: 'hello from B' }] 
          });
          window._port.removeEventListener('message', handler);
        }
      });
    }, { reqId });

    console.log('⏳ Waiting for propagation...');
    await new Promise(r => setTimeout(r, 1500));

    console.log('\n📊 Checking results...');
    const subsA = await pageA.evaluate(() => window.__subs);
    console.log('Page A subscriptions:', subsA.length);
    
    subsA.forEach((snap, i) => {
      console.log(`  Snapshot ${i}: ${snap.length} documents`);
      snap.forEach(doc => console.log(`    - ${doc.title || doc._id}`));
    });

    await browser.close();

    const found = subsA.some(arr => Array.isArray(arr) && arr.some(d => d?.title === 'hello from B'));

    console.log('\n' + (found ? '✅ SUCCESS: SharedWorker forwarded updates between pages!' : '❌ FAILED: Update not received'));
    process.exitCode = found ? 0 : 1;
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await browser.close();
    process.exitCode = 1;
  }
})();
