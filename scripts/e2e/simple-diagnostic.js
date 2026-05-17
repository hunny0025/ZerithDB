const { chromium } = require('playwright');

(async ()=>{
  console.log('Starting simple diagnostic test...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable detailed console logging
  page.on('console', msg => {
    console.log(`[PAGE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  page.on('error', err => {
    console.error('[PAGE ERROR]:', err);
  });

  page.on('pageerror', err => {
    console.error('[PAGE EXCEPTION]:', err);
  });

  try {
    console.log('Loading test page...');
    await page.goto('http://localhost:3000/sw-test.html', { waitUntil: 'domcontentloaded', timeout: 10000 });

    console.log('Attempting to create SharedWorker...');
    const result = await page.evaluate(() => {
      try {
        console.log('Creating new SharedWorker...');
        const worker = new SharedWorker('/shared-worker.js');
        console.log('SharedWorker created:', worker);
        return { success: true, message: 'SharedWorker created' };
      } catch (err) {
        console.error('Error creating SharedWorker:', err.message);
        return { success: false, message: err.message };
      }
    });

    console.log('Result:', result);

    // Keep page open for 5 seconds to see any errors
    await page.waitForTimeout(5000);

    await browser.close();
    
    if (result.success) {
      console.log('✅ Diagnostic: SharedWorker instantiation successful');
      process.exitCode = 0;
    } else {
      console.log('❌ Diagnostic: SharedWorker instantiation failed:', result.message);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Diagnostic test error:', error);
    await browser.close();
    process.exitCode = 1;
  }
})();
