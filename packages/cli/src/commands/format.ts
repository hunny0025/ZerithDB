import { execa } from "execa";
import chalk from "chalk";
import ora from "ora";
import path from "node:path";
import fs from "node:fs/promises";

export async function formatCommand(schemaPath?: string) {
  const targetPath = path.resolve(process.cwd(), schemaPath || "zerithdb.schema.ts");
  const spinner = ora(`Formatting schema at ${targetPath}...`).start();

  try {
    try {
      await fs.access(targetPath);
    } catch {
      spinner.fail(chalk.red(`Schema file not found at ${targetPath}.`));
      process.exit(1);
    }

    try {
      await execa("npx", ["prettier", "--write", targetPath]);
      spinner.succeed(chalk.green("Schema formatted successfully."));
    } catch (err: unknown) {
      spinner.fail(
        chalk.red(
          "Prettier formatting failed. Is prettier installed and accessible in the environment?"
        )
      );
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  } catch (err) {
    spinner.fail(chalk.red("Failed to format the schema file."));
    console.error(err);
    process.exit(1);
  }
}
