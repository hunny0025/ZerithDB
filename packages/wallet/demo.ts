/* eslint-disable */
import { WalletHost } from "zerithdb-wallet";
import { createApp } from "zerithdb-sdk";

// --- Setup Wallet Host (in our mock iframe origin) ---
const walletHost = new WalletHost({
  appId: "wallet-host",
});

// --- Setup App A (on origin A) ---
const appA = createApp({
  appId: "photo-app",
  auth: {
    walletUrl: "http://localhost:3000/wallet.html", // Mock URL
  },
});

// --- Setup App B (on origin B) ---
const appB = createApp({
  appId: "note-app",
  auth: {
    walletUrl: "http://localhost:3000/wallet.html", // Mock URL
  },
});

// Both appA and appB now share the SAME identity because they both
// use the SAME walletUrl iframe origin!

// --- Demonstrate Universal File Picker ---
async function runDemo() {
  console.log("App A requesting a file from the user's global wallet...");
  const picked = await appA.pickFile({
    title: "Select an image for your profile",
    collection: "photos",
  });

  if (picked) {
    console.log("App A received data from another origin!", picked);
  }
}

runDemo();
