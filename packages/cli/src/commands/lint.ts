import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import ora from "ora";

export async function lintCommand(schemaPath?: string) {
  const spinner = ora("Linting ZerithDB schema...").start();

  try {
    const targetPath = path.resolve(process.cwd(), schemaPath || "zerithdb.schema.ts");

    let content: string;
    try {
      content = await fs.readFile(targetPath, "utf-8");
    } catch (err: unknown) {
      if (err instanceof Error && "code" in err && (err as any).code === "ENOENT") {
        spinner.fail(
          chalk.red(`Schema file not found at ${targetPath}. Please provide a valid schema file.`)
        );
        process.exit(1);
      }
      throw err;
    }

    let warnings = 0;

    // Check for `id` or `_id` field definitions, which is an anti-pattern.
    const idRegex = /['"]?(?:_id|id)['"]?\s*:\s*['"][^'"]+['"]/g;
    let match;
    while ((match = idRegex.exec(content)) !== null) {
      spinner.warn(
        chalk.yellow(
          `Warning: Found manual id definition "${match[0]}". ZerithDB automatically handles _id using UUID v7. Defining it manually is an anti-pattern.`
        )
      );
      warnings++;
    }

    // Attempt to guess collections and warn if they don't seem to have indexed fields.
    // Extremely simplistic regex approximation for finding object blocks.
    const collectionsRegex = /([a-zA-Z0-9_]+)\s*:\s*\{([^}]+)\}/g;
    let collectionMatch;

    while ((collectionMatch = collectionsRegex.exec(content)) !== null) {
      const collectionName = collectionMatch[1];
      const fieldsBlock = collectionMatch[2];

      // A simple heuristic for index detection: wait for our schema definition
      // If we see fields without indexes, maybe we warn?
      // Since Dexie indexing convention isn't heavily enforced in defineSchema yet we just
      // check if any field has `&` (unique) or `*` (multi), or just warn if no obvious indexes.
      // For this lint rule, let's just make sure there's no manual ids, and we can add a check for missing indexes if there are a lot of fields.
      const fields = fieldsBlock.split("\n").filter((l) => l.trim().length > 0);
      if (fields.length > 5 && !fieldsBlock.includes("&") && !fieldsBlock.includes("*")) {
        spinner.warn(
          chalk.yellow(
            `Warning: Collection "${collectionName}" has many fields but no apparent indexes (like & or *). Consider indexing frequently queried fields for better performance.`
          )
        );
        warnings++;
      }
    }

    if (warnings > 0) {
      spinner.info(chalk.blueBright(`Linting finished with ${warnings} warning(s).`));
    } else {
      spinner.succeed(chalk.green("Schema looks great! No anti-patterns detected."));
    }
  } catch (err) {
    spinner.fail(chalk.red("Failed to lint the schema file."));
    console.error(err);
    process.exit(1);
  }
}
