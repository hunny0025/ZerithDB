import dns from "dns/promises";
import chalk from "chalk";

export async function checkConnectivity(): Promise<void> {
  try {
    await dns.lookup("registry.npmjs.org");
  } catch {
    console.warn(
      chalk.yellow(`
⚠️  Warning: No internet connection detected.

   Some ZerithDB CLI features require network access:
   - Dependency installation (npm install)
   - Fetching latest templates
   - Connecting to signaling servers

   You can still scaffold apps offline, but run
   ${chalk.cyan("npm install")} once you're back online.
`)
    );
  }
}
