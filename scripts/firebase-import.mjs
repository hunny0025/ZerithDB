#!/usr/bin/env node
/**
 * scripts/firebase-import.mjs
 *
 * Imports a Firebase Realtime Database JSON export into ZerithDB-compatible
 * collection/document JSON files.
 *
 * Usage:
 *   node scripts/firebase-import.mjs <firebase-export.json> [--out <dir>]
 *
 * Firebase RTDB exports look like:
 * {
 *   "users": {
 *     "-Mxyz1": { "name": "Alice", "age": 30 },
 *     "-Mxyz2": { "name": "Bob",   "age": 25 }
 *   },
 *   "posts": {
 *     "-Mabc1": { "title": "Hello", "body": "World", "tags": ["a","b"] }
 *   }
 * }
 *
 * Each top-level key becomes a ZerithDB collection.
 * Each child object becomes a document in that collection.
 * Arrays, nested objects, and primitive values are preserved as-is.
 *
 * Output is written as one JSON file per collection to the output directory:
 *   <out>/users.json   → [{ "_firebaseKey": "-Mxyz1", "name": "Alice", ... }, ...]
 *   <out>/posts.json   → [{ "_firebaseKey": "-Mabc1", "title": "Hello", ... }, ...]
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { resolve, basename, dirname } from "path";
import { fileURLToPath } from "url";

// ─── Constants ───────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT_DIR = resolve(__dirname, "..", "firebase-import-output");
const MAX_FILE_SIZE_BYTES = 512 * 1024 * 1024; // 512 MB safety limit

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse CLI arguments into a structured object.
 * Supports: node firebase-import.mjs <file> [--out <dir>]
 *
 * @returns {{ inputFile: string, outputDir: string }}
 */
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const inputFile = resolve(args[0]);
  let outputDir = DEFAULT_OUT_DIR;

  const outIndex = args.indexOf("--out");
  if (outIndex !== -1 && args[outIndex + 1]) {
    outputDir = resolve(args[outIndex + 1]);
  }

  return { inputFile, outputDir };
}

/** Print usage instructions to stdout. */
function printUsage() {
  console.log(`
🔥 Firebase → ZerithDB Import Tool
${"─".repeat(44)}

Usage:
  node scripts/firebase-import.mjs <firebase-export.json> [--out <dir>]

Arguments:
  <firebase-export.json>   Path to the Firebase RTDB JSON export file
  --out <dir>              Output directory for collection JSON files
                           (default: ./firebase-import-output)

Examples:
  node scripts/firebase-import.mjs ./data.json
  node scripts/firebase-import.mjs ./backup.json --out ./collections
`);
}

/**
 * Read and parse a JSON file safely.
 * Validates file size to prevent OOM on very large exports.
 *
 * @param {string} filePath - Absolute path to the JSON file
 * @returns {Promise<Record<string, unknown>>} Parsed JSON object
 */
async function readJsonFile(filePath) {
  let raw;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch (err) {
    if (err.code === "ENOENT") {
      throw new Error(`File not found: ${filePath}`);
    }
    if (err.code === "EACCES") {
      throw new Error(`Permission denied: ${filePath}`);
    }
    throw new Error(`Failed to read file: ${err.message}`);
  }

  if (Buffer.byteLength(raw, "utf-8") > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File exceeds ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB safety limit. ` +
        `Consider splitting the export into smaller files.`
    );
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Expected a JSON object at the root level (not array or primitive).");
    }
    return parsed;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${basename(filePath)}: ${err.message}`);
    }
    throw err;
  }
}

/**
 * Determine whether a value represents a collection of documents.
 * A "collection" is a plain object whose values are all plain objects (documents).
 * If any child value is a primitive or array, the parent is treated as a single document.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isCollection(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const entries = Object.values(value);
  if (entries.length === 0) return false;
  return entries.every((v) => v !== null && typeof v === "object" && !Array.isArray(v));
}

/**
 * Convert a Firebase collection node into an array of ZerithDB-compatible documents.
 * Each Firebase key is stored as `_firebaseKey` for traceability.
 * Nested objects and arrays are preserved as-is within each document.
 *
 * @param {Record<string, Record<string, unknown>>} node - Firebase collection node
 * @returns {Array<Record<string, unknown>>} Array of documents
 */
function collectionToDocuments(node) {
  return Object.entries(node).map(([firebaseKey, fields]) => ({
    _firebaseKey: firebaseKey,
    ...fields,
  }));
}

/**
 * Write a collection's documents to a JSON file.
 *
 * @param {string} outputDir - Output directory path
 * @param {string} collectionName - Name of the collection
 * @param {Array<Record<string, unknown>>} documents - Array of documents
 * @returns {Promise<void>}
 */
async function writeCollection(outputDir, collectionName, documents) {
  await mkdir(outputDir, { recursive: true });
  const filePath = resolve(outputDir, `${collectionName}.json`);
  await writeFile(filePath, JSON.stringify(documents, null, 2), "utf-8");
}

// ─── Main ────────────────────────────────────────────────────────────────────

/**
 * Main import pipeline.
 * 1. Parse CLI args
 * 2. Read Firebase JSON export
 * 3. Iterate top-level keys as collections
 * 4. Convert each to documents and write to output directory
 * 5. Log summary
 */
async function main() {
  const { inputFile, outputDir } = parseArgs();

  console.log(`\n🔥 Firebase → ZerithDB Import`);
  console.log("─".repeat(44));
  console.log(`📂 Input:  ${inputFile}`);
  console.log(`📁 Output: ${outputDir}\n`);

  // Step 1: Read and parse JSON
  const data = await readJsonFile(inputFile);
  const topLevelKeys = Object.keys(data);
  console.log(`📊 Found ${topLevelKeys.length} top-level key(s) in export\n`);

  if (topLevelKeys.length === 0) {
    console.log("⚠️  Empty export file — nothing to import.\n");
    process.exit(0);
  }

  // Step 2: Process each top-level key
  let totalCollections = 0;
  let totalDocuments = 0;
  let skippedKeys = 0;
  const results = [];

  for (const key of topLevelKeys) {
    const value = data[key];

    if (isCollection(value)) {
      // Key maps to a collection of documents
      const docs = collectionToDocuments(value);
      await writeCollection(outputDir, key, docs);

      totalCollections++;
      totalDocuments += docs.length;
      results.push({ collection: key, documents: docs.length });
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      // Key maps to a single document — wrap it in a collection of one
      const docs = [{ _firebaseKey: key, ...value }];
      await writeCollection(outputDir, key, docs);

      totalCollections++;
      totalDocuments += 1;
      results.push({ collection: key, documents: 1 });
    } else {
      // Primitive or array at root level — skip with warning
      console.log(
        `⚠️  Skipped "${key}" — root-level ${Array.isArray(value) ? "array" : typeof value} ` +
          `values are not directly importable as collections.`
      );
      skippedKeys++;
    }
  }

  // Step 3: Print summary
  console.log("\n" + "─".repeat(44));
  console.log("📋 Import Summary\n");

  if (results.length > 0) {
    const maxName = Math.max(...results.map((r) => r.collection.length), 10);
    console.log(`${"Collection".padEnd(maxName + 2)} Documents`);
    console.log(`${"─".repeat(maxName + 2)} ${"─".repeat(10)}`);
    for (const { collection, documents } of results) {
      console.log(`${collection.padEnd(maxName + 2)} ${String(documents).padStart(10)}`);
    }
  }

  console.log(`\n✅ ${totalCollections} collection(s), ${totalDocuments} document(s) imported.`);
  if (skippedKeys > 0) {
    console.log(`⚠️  ${skippedKeys} top-level key(s) skipped.`);
  }
  console.log(`📁 Output written to: ${outputDir}\n`);
}

main().catch((err) => {
  console.error(`\n❌ Import failed: ${err.message}\n`);
  process.exit(1);
});
