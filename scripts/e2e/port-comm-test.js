const { chromium } = require("playwright");

(async () => {
  console.log("Testing SharedWorker port communication...");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("console", (msg) => {
    console.log(`[PAGE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  page.on("error", (err) => {
    console.error("[PAGE ERROR]:", err);
  });

  page.on("pageerror", (err) => {
    console.error("[PAGE EXCEPTION]:", err);
  });

  try {
    console.log("Loading test page...");
    await page.goto("http://localhost:3000/sw-test.html", {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });

    console.log("Setting up SharedWorker and port communication...");
    const result = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        try {
          const worker = new SharedWorker("/shared-worker.js");
          const port = worker.port;

          // Set up message handler
          const messageLog = [];
          const timeoutHandle = setTimeout(() => {
            resolve({ success: false, message: "Timeout waiting for response", log: messageLog });
          }, 5000);

          port.onmessage = (event) => {
            console.log("Port received message:", event.data);
            messageLog.push(event.data);
            if (event.data.kind === "response" && event.data.id === "init") {
              clearTimeout(timeoutHandle);
              resolve({ success: true, message: "Received init response", log: messageLog });
            }
          };

          port.onerror = (error) => {
            console.error("Port error:", error);
            clearTimeout(timeoutHandle);
            resolve({
              success: false,
              message: "Port error: " + (error.message || error),
              log: messageLog,
            });
          };

          // Start the port
          port.start();
          console.log("Port started");

          // Send init message
          console.log("Sending init message...");
          port.postMessage({ kind: "init", appId: "test", config: { appId: "test" } });
          messageLog.push({ event: "SENT", data: { kind: "init" } });
        } catch (err) {
          console.error("Error:", err.message, err.stack);
          resolve({ success: false, message: err.message });
        }
      });
    });

    console.log("Result:", JSON.stringify(result, null, 2));

    await browser.close();

    if (result.success) {
      console.log("✅ Port communication test passed");
      process.exitCode = 0;
    } else {
      console.log("❌ Port communication test failed");
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("Test error:", error);
    await browser.close();
    process.exitCode = 1;
  }
})();
