import type { ConflictResolver } from "zerithdb-core";

function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  const chunkSize = 32768;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export function createTransformersResolver(modelName = "gpt2"): ConflictResolver {
  return {
    id: `transformers-resolver:${modelName}`,
    version: 1,
    resolveConflict: async (collectionName, localSnapshot, incomingUpdate, fromPeer) => {
      try {
        const tf = (globalThis as typeof globalThis & {
          transformers?: { pipeline?: (...args: any[]) => Promise<any> };
        }).transformers;

        if (!tf || typeof tf.pipeline !== "function") {
          return incomingUpdate;
        }

        const prompt = `You are an assistant that proposes semantically-correct merges of text-heavy CRDT content.
Collection: ${collectionName}
From: ${fromPeer}
LocalUpdate(base64): ${toBase64(localSnapshot)}
IncomingUpdate(base64): ${toBase64(incomingUpdate)}

Provide a concise, human-readable suggestion describing how to merge the incoming change into the local state. Keep it under 120 words.`;

        const pipeline = await tf.pipeline("text-generation", modelName);
        const output = await pipeline(prompt, { max_length: 200 });
        const text = Array.isArray(output) ? output[0]?.generated_text ?? String(output) : String(output);

        return { update: incomingUpdate, suggestion: text.trim() };
      } catch (error) {
        console.warn("Transformers resolver failed:", error);
        return incomingUpdate;
      }
    },
  };
}