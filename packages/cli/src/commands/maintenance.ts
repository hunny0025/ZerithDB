import chalk from "chalk";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

export async function maintenanceCommand(status: string): Promise<void> {
  const maintenanceFile = path.join(process.cwd(), ".maintenance");

  if (status === "on") {
    fs.writeFileSync(maintenanceFile, "1");
    console.log(
      chalk.yellow("🚧 Maintenance mode enabled. Signaling server will reject new peers.")
    );
  } else if (status === "off") {
    if (fs.existsSync(maintenanceFile)) {
      fs.unlinkSync(maintenanceFile);
    }
    console.log(chalk.green("✅ Maintenance mode disabled. Signaling server is accepting peers."));
  } else {
    console.error(chalk.red("Invalid status. Use 'on' or 'off'."));
    process.exit(1);
  }
}
