// Galois Field (2^8) constants
const PRIMITIVE = 0x011b; // x^8 + x^4 + x^3 + x + 1

let logTable = new Uint8Array(256);
let expTable = new Uint8Array(256);

function initGF(): void {
  if (expTable[1] === 1) return; // already initialized
  let x = 1;
  for (let i = 0; i < 255; i++) {
    expTable[i] = x;
    logTable[x] = i;
    x <<= 1;
    if ((x & 0x100) !== 0) {
      x ^= PRIMITIVE;
    }
  }
  expTable[255] = expTable[0];
  logTable[0] = 0;
}

function gfAdd(a: u8, b: u8): u8 {
  return a ^ b;
}

function gfMul(a: u8, b: u8): u8 {
  if (a === 0 || b === 0) return 0;
  let logA = logTable[a] as u32;
  let logB = logTable[b] as u32;
  return expTable[(logA + logB) % 255];
}

function gfDiv(a: u8, b: u8): u8 {
  if (b === 0) throw new Error("Division by zero");
  if (a === 0) return 0;
  let logA = logTable[a] as u32;
  let logB = logTable[b] as u32;
  return expTable[(logA + 255 - logB) % 255];
}

function polyEval(coeff: Uint8Array, x: u8): u8 {
  let result: u8 = 0;
  for (let i = coeff.length - 1; i >= 0; i--) {
    result = gfAdd(gfMul(result, x), coeff[i]);
  }
  return result;
}

let memoryOffset: usize = 1024;
export function alloc(size: usize): usize {
  let ptr = memoryOffset;
  memoryOffset += size;
  return ptr;
}
export function freeAll(): void {
  memoryOffset = 1024;
}

export function splitSecret(secretPtr: usize, secretLen: i32, threshold: i32, total: i32): usize {
  initGF();
  
  let secret = new Uint8Array(secretLen);
  for (let i = 0; i < secretLen; i++) {
    secret[i] = load<u8>(secretPtr + i);
  }

  let shardLen = secretLen + 1;
  let outPtr = alloc(total * shardLen);

  for (let s = 0; s < secretLen; s++) {
    let coeff = new Uint8Array(threshold);
    coeff[0] = secret[s];
    for (let i = 1; i < threshold; i++) {
      coeff[i] = u8(Math.floor(Math.random() * 255) + 1);
    }

    for (let i = 0; i < total; i++) {
      let x = u8(i + 1);
      let y = polyEval(coeff, x);
      
      // Store in output format: [x, y0, y1, ...] per shard
      let shardOffset = outPtr + (i * shardLen);
      if (s === 0) {
        store<u8>(shardOffset, x);
      }
      store<u8>(shardOffset + 1 + s, y);
    }
  }

  return outPtr;
}

export function recoverSecret(shardsPtr: usize, shardsCount: i32, secretLen: i32): usize {
  initGF();

  let shardLen = secretLen + 1;
  let outPtr = alloc(secretLen);

  // Read x coordinates
  let xs = new Uint8Array(shardsCount);
  for (let i = 0; i < shardsCount; i++) {
    xs[i] = load<u8>(shardsPtr + (i * shardLen));
  }

  for (let s = 0; s < secretLen; s++) {
    let secretByte: u8 = 0;

    for (let i = 0; i < shardsCount; i++) {
      let xi = xs[i];
      let yi = load<u8>(shardsPtr + (i * shardLen) + 1 + s);
      
      let num: u8 = 1;
      let den: u8 = 1;

      for (let j = 0; j < shardsCount; j++) {
        if (i !== j) {
          let xj = xs[j];
          num = gfMul(num, gfAdd(xj, 0)); // evaluate at 0: 0 - xj = xj
          den = gfMul(den, gfAdd(xi, xj));
        }
      }

      let term = gfMul(yi, gfDiv(num, den));
      secretByte = gfAdd(secretByte, term);
    }

    store<u8>(outPtr + s, secretByte);
  }

  return outPtr;
}
