const fs = require("fs");
const path = require("path");

const wasmPath = path.join(__dirname, "../dist/sss.wasm");
const wasmBuf = fs.readFileSync(wasmPath);
const base64 = wasmBuf.toString("base64");

const outPath = path.join(__dirname, "../src/wasm-base64.ts");
fs.writeFileSync(outPath, `export const wasmBase64 = "${base64}";\n`);
console.log("Inlined WASM to src/wasm-base64.ts");
