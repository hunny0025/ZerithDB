#!/usr/bin/env node
import { program } from "commander";
import chalk from "chalk";
import { initCommand } from "./commands/init.js";
import { signalCommand } from "./commands/signal.js";
import { maintenanceCommand } from "./commands/maintenance.js";
import { checkConnectivity } from "./checkConnectivity.js";

const VERSION = "0.1.0";

console.log(
  chalk.cyan(`
  ██████╗ ███████╗███████╗██████╗ ██████╗  █████╗ ███████╗███████╗
  ██╔══██╗██╔════╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔════╝
  ██████╔╝█████╗  █████╗  ██████╔╝██████╔╝███████║███████╗█████╗
  ██╔═══╝ ██╔══╝  ██╔══╝  ██╔══██╗██╔══██╗██╔══██║╚════██║██╔══╝
  ██║     ███████╗███████╗██║  ██║██████╔╝██║  ██║███████║███████╗
  ╚═╝     ╚══════╝╚══════╝╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝
  `)
);
console.log(chalk.gray(`  Build full-stack apps with ZERO backend. v${VERSION}\n`));

async function main() {
  await checkConnectivity();

  program
    .name("zerithdb")
    .description("ZerithDB CLI — scaffold and manage local-first P2P apps")
    .version(VERSION);

  program
    .command("init [app-name]")
    .description("Scaffold a new ZerithDB application")
    .option("-t, --template <template>", "Starter template", "todo")
    .option("--no-install", "Skip dependency installation")
    .action(initCommand);

  program
    .command("maintenance <status>")
    .description("Toggle maintenance mode for the signaling server (on/off)")
    .action(maintenanceCommand);

  program
    .command("signal")
    .description("Start a local WebSocket signaling server for development")
    .option("-p, --port <port>", "Port to listen on", "4000")
    .action(signalCommand);

  program.parse(process.argv);
}

main();
