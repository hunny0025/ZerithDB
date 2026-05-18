// scripts/setup-git-config.js
//
// Registers the custom `ours-then-install` merge driver for pnpm-lock.yaml.
// This driver:
//   1. Accepts the incoming (theirs) version of the lockfile — avoiding
//      hundreds of conflict markers — then
//   2. Runs `pnpm install` to reconcile the result so node_modules stays
//      consistent.
//
// This script is called automatically by `pnpm prepare` (husky init)
// and is fully cross-platform (Windows, macOS, Linux).

const { execSync } = require("child_process");

console.log("🔧  Registering pnpm-lock.yaml merge driver...");

try {
  // 1. Register the name of the driver
  execSync(
    'git config merge.ours-then-install.name "Accept incoming lockfile, then run pnpm install"',
    { stdio: "inherit" }
  );

  // 2. Register the driver command (%O = base, %A = ours, %B = theirs)
  // Git always wraps this command in a sh-like context internally, so 'cp' works on all platforms.
  execSync(
    'git config merge.ours-then-install.driver "cp %B %A && pnpm install"',
    { stdio: "inherit" }
  );

  console.log("✅  Done. Git will now resolve pnpm-lock.yaml conflicts automatically.");
} catch (error) {
  console.error("❌  Failed to register git merge driver:", error.message);
  process.exit(1);
}
