import { wasmBase64 } from "./wasm-base64";

function decodeBase64(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(b64, "base64");
  } else {
    const binString = atob(b64);
    return Uint8Array.from(binString, (m) => m.codePointAt(0)!);
  }
}

function encodeBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  } else {
    const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
    return btoa(binString);
  }
}

let wasmInstance: WebAssembly.Instance | null = null;
let wasmMemory: WebAssembly.Memory | null = null;

export async function getWasm(): Promise<{ instance: WebAssembly.Instance; memory: WebAssembly.Memory }> {
  if (wasmInstance && wasmMemory) return { instance: wasmInstance, memory: wasmMemory };
  const bytes = decodeBase64(wasmBase64);
  const mod: any = await WebAssembly.instantiate(bytes, {
    env: {
      abort: () => { throw new Error("WASM abort"); }
    }
  });
  wasmInstance = mod.instance as WebAssembly.Instance;
  wasmMemory = wasmInstance.exports.memory as WebAssembly.Memory;
  return { instance: wasmInstance, memory: wasmMemory };
}

export async function splitSecret(secret: Uint8Array, threshold: number, total: number): Promise<string[]> {
  const { instance, memory } = await getWasm();
  const exports = instance.exports as any;
  
  exports.freeAll();
  const secretLen = secret.length;
  const secretPtr = exports.alloc(secretLen);
  
  const memArray = new Uint8Array(memory.buffer);
  memArray.set(secret, secretPtr);
  
  const outPtr = exports.splitSecret(secretPtr, secretLen, threshold, total);
  
  const shardLen = secretLen + 1;
  const shards: string[] = [];
  
  for (let i = 0; i < total; i++) {
    const shardBytes = new Uint8Array(memory.buffer, outPtr + (i * shardLen), shardLen);
    const shardCopy = new Uint8Array(shardBytes); // copy before it's overwritten
    shards.push(encodeBase64(shardCopy));
  }
  
  return shards;
}

export async function recoverSecret(shardsBase64: string[]): Promise<Uint8Array> {
  if (shardsBase64.length === 0) throw new Error("No shards provided");
  const shards = shardsBase64.map(decodeBase64);
  const firstShard = shards[0];
  if (!firstShard) throw new Error("Invalid shard");
  const shardLen = firstShard.length;
  const secretLen = shardLen - 1;
  const shardsCount = shards.length;
  
  const { instance, memory } = await getWasm();
  const exports = instance.exports as any;
  
  exports.freeAll();
  const shardsPtr = exports.alloc(shardsCount * shardLen);
  
  const memArray = new Uint8Array(memory.buffer);
  for (let i = 0; i < shardsCount; i++) {
    const shard = shards[i];
    if (shard) {
      memArray.set(shard as Uint8Array, shardsPtr + (i * shardLen));
    }
  }
  
  const outPtr = exports.recoverSecret(shardsPtr, shardsCount, secretLen);
  
  const secretBytes = new Uint8Array(memory.buffer, outPtr, secretLen);
  return new Uint8Array(secretBytes); // copy
}
