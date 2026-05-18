import * as Y from "yjs";
import type { ConflictResolver } from "zerithdb-core";
import { MERGE_PROMPT, parseLLMOutput } from "./prompts.js";
import { loadModel } from "./transformers.js";

type ConflictSample = {
  localText: string;
  remoteText: string;
};

function decodeConflict(localSnapshot: Uint8Array, incomingUpdate: Uint8Array): ConflictSample | null {
  if (!localSnapshot.length || !incomingUpdate.length) return null;

  try {
    const localDoc = new Y.Doc();
    Y.applyUpdate(localDoc, localSnapshot);

    const remoteDoc = new Y.Doc();
    Y.applyUpdate(remoteDoc, localSnapshot);
    Y.applyUpdate(remoteDoc, incomingUpdate);

    const localText = extractAllText(localDoc);
    const remoteText = extractAllText(remoteDoc);

    if (!localText && !remoteText) return null;
    if (localText === remoteText) return null;

    return { localText, remoteText };
  } catch {
    return null;
  }
}

function extractAllText(doc: Y.Doc): string {
  const texts: string[] = [];

  doc.share.forEach((_type, key) => {
    try {
      const text = doc.getText(key);
      if (text.length > 0) {
        texts.push(text.toString());
      }
    } catch {
      // Ignore non-text shared types.
    }
  });

  return texts.join("\n");
}

function encodeMerge(text: string): Uint8Array {
  const doc = new Y.Doc();
  const ytext = doc.getText("content");
  ytext.insert(0, text);
  return Y.encodeStateAsUpdate(doc);
}

export interface LLMConflictResolverOptions {
  modelName?: string;
  autoApplyThreshold?: number;
  maxRetries?: number;
}

export class LLMConflictResolver implements ConflictResolver {
  readonly id = "llm-conflict-resolver";
  readonly version = 1;

  private modelName: string;
  private autoApplyThreshold: number;
  private maxRetries: number;

  constructor(options: LLMConflictResolverOptions = {}) {
    this.modelName = options.modelName ?? "Xenova/LaMini-Flan-T5-783M";
    this.autoApplyThreshold = options.autoApplyThreshold ?? 0.7;
    this.maxRetries = options.maxRetries ?? 2;
  }

  async resolveConflict(
    collectionName: string,
    localSnapshot: Uint8Array,
    incomingUpdate: Uint8Array,
    fromPeer: string
  ): Promise<Uint8Array | { update: Uint8Array; suggestion?: string } | null> {
    const conflict = decodeConflict(localSnapshot, incomingUpdate);
    if (!conflict) return incomingUpdate;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const generate = await loadModel(this.modelName);
        const prompt = `${MERGE_PROMPT(collectionName, conflict.localText, conflict.remoteText)}\nFrom peer: ${fromPeer}`;
        const result = await generate(prompt);
        const output = result?.[0]?.generated_text ?? "";
        const parsed = parseLLMOutput(output);

        if (!parsed) {
          console.warn(
            `[LLMConflictResolver] Failed to parse LLM output for collection "${collectionName}" — flagging for manual review`
          );
          return null;
        }

        const confidence = this.estimateConfidence(
          conflict.localText,
          conflict.remoteText,
          parsed.merged
        );

        if (confidence >= this.autoApplyThreshold) {
          return { update: encodeMerge(parsed.merged), suggestion: parsed.explanation };
        }

        return null;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `[LLMConflictResolver] Attempt ${attempt}/${this.maxRetries} failed for collection "${collectionName}": ${lastError.message}`
        );

        if (attempt < this.maxRetries) {
          await this.delay(500 * attempt);
        }
      }
    }

    console.error(
      `[LLMConflictResolver] All ${this.maxRetries} attempts failed for collection "${collectionName}", applying update unchanged`
    );
    return incomingUpdate;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private estimateConfidence(local: string, remote: string, merged: string): number {
    if (!merged) return 0;

    const localSim = this.similarity(local, merged);
    const remoteSim = this.similarity(remote, merged);

    return Math.min(localSim, remoteSim);
  }

  private similarity(a: string, b: string): number {
    if (a === b) return 1;
    if (!a || !b) return 0;

    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;

    const dist = this.levenshtein(a, b);
    return 1 - dist / maxLen;
  }

  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }
}