const { chromium } = require('playwright');

(async ()=>{
  console.log('Testing minimal worker...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`[PAGE] ${msg.text()}`);
  });

  page.on('error', err => console.error('[ERROR]:', err));
  page.on('pageerror', err => console.error('[EXCEPTION]:', err));

  try {
    await page.goto('http://localhost:3000/sw-test.html', { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(() => {
      return new Promise((resolve) => {
        const worker = new SharedWorker('/test-worker.js');
        const port = worker.port;
        
        const timeout = setTimeout(() => {
          resolve({ success: false, message: 'Timeout' });
        }, 3000);

        port.onmessage = (event) => {
          console.log('Message received:', event.data.kind);
          clearTimeout(timeout);
          if (event.data.kind === 'response' && event.data.id === 'init') {
            resolve({ success: true, message: 'Init response received' });
          }
        };

        port.onerror = (err) => {
          clearTimeout(timeout);
          resolve({ success: false, message: 'Port error' });
        };

        port.start();
        console.log('Sending init...');
        port.postMessage({ kind: 'init', appId: 'test', config: {} });
      });
    });

    console.log('Result:', result);
    await browser.close();

    process.exitCode = result.success ? 0 : 1;
  } catch (error) {
    console.error('Test error:', error);
    await browser.close();
    process.exitCode = 1;
  }
})();
