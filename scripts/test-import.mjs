#!/usr/bin/env node
/**
 * Quick self-test for firebase-import.mjs
 * Run: node scripts/test-import.mjs
 */
import { readFile, rm } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const OUT = resolve(root, "scripts", "fixtures", "test-output");

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

async function run() {
  console.log("\n🧪 Firebase Import — Self Test\n" + "─".repeat(40));

  // Test 1: Run the script
  console.log("\n📌 Test 1: Run import on sample fixture");
  try {
    const { stdout, stderr } = await exec("node", [
      resolve(root, "scripts/firebase-import.mjs"),
      resolve(root, "scripts/fixtures/sample-firebase-export.json"),
      "--out",
      OUT,
    ]);
    console.log(stdout);
    assert(stdout.includes("collection(s)"), "Output mentions collections");
    assert(stdout.includes("document(s) imported"), "Output mentions documents imported");
  } catch (err) {
    console.error("Script execution failed:", err.message);
    assert(false, "Script runs without error");
  }

  // Test 2: Verify output files exist and have correct content
  console.log("\n📌 Test 2: Verify output files");
  try {
    const usersRaw = await readFile(resolve(OUT, "users.json"), "utf-8");
    const users = JSON.parse(usersRaw);
    assert(Array.isArray(users), "users.json is an array");
    assert(users.length === 3, `users.json has 3 documents (got ${users.length})`);
    assert(users[0]._firebaseKey === "-Mxyz1", "First user has correct _firebaseKey");
    assert(users[0].name === "Alice", "First user has correct name");
  } catch (err) {
    assert(false, `users.json readable: ${err.message}`);
  }

  try {
    const postsRaw = await readFile(resolve(OUT, "posts.json"), "utf-8");
    const posts = JSON.parse(postsRaw);
    assert(Array.isArray(posts), "posts.json is an array");
    assert(posts.length === 2, `posts.json has 2 documents (got ${posts.length})`);
    assert(Array.isArray(posts[0].tags), "Post preserves array fields");
    assert(typeof posts[0].metadata === "object", "Post preserves nested objects");
  } catch (err) {
    assert(false, `posts.json readable: ${err.message}`);
  }

  try {
    const commentsRaw = await readFile(resolve(OUT, "comments.json"), "utf-8");
    const comments = JSON.parse(commentsRaw);
    assert(comments.length === 2, `comments.json has 2 documents (got ${comments.length})`);
  } catch (err) {
    assert(false, `comments.json readable: ${err.message}`);
  }

  try {
    const settingsRaw = await readFile(resolve(OUT, "settings.json"), "utf-8");
    const settings = JSON.parse(settingsRaw);
    assert(
      settings.length === 1,
      `settings.json wrapped as single document (got ${settings.length})`
    );
    assert(settings[0].theme === "dark", "Settings preserves primitive values");
    assert(settings[0].notifications.email === true, "Settings preserves nested booleans");
  } catch (err) {
    assert(false, `settings.json readable: ${err.message}`);
  }

  // Test 3: Error handling — missing file
  console.log("\n📌 Test 3: Error handling");
  try {
    await exec("node", [resolve(root, "scripts/firebase-import.mjs"), "nonexistent-file.json"]);
    assert(false, "Should fail on missing file");
  } catch (err) {
    assert(
      err.stderr?.includes("Import failed") ||
        err.stdout?.includes("Import failed") ||
        err.code === 1,
      "Exits with error on missing file"
    );
  }

  // Test 4: Help flag
  console.log("\n📌 Test 4: Help flag");
  try {
    const { stdout } = await exec("node", [resolve(root, "scripts/firebase-import.mjs"), "--help"]);
    assert(stdout.includes("Firebase"), "Help output mentions Firebase");
    assert(stdout.includes("Usage"), "Help output shows usage");
  } catch {
    assert(false, "Help flag works");
  }

  // Cleanup
  await rm(OUT, { recursive: true, force: true });

  // Summary
  console.log("\n" + "─".repeat(40));
  console.log(`\n🏁 Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
