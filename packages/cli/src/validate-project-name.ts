import validate from "validate-npm-package-name";
import chalk from "chalk";

export function getProjectNameError(name: string): string | null {
  const { validForNewPackages, errors, warnings } = validate(name);

  if (!validForNewPackages) {
    const allIssues = [...(errors ?? []), ...(warnings ?? [])];
    // Return the first issue as a concise prompt-friendly string
    return allIssues[0] ?? "Invalid package name.";
  }

  return null;
}

export function validateProjectName(name: string): void {
  const { validForNewPackages, errors, warnings } = validate(name);

  if (!validForNewPackages) {
    console.error(chalk.red(`\n✖  Invalid project name: `) + chalk.bold.red(`"${name}"`));

    errors?.forEach((err: string) => console.error(chalk.red(`   • ${err}`)));
    warnings?.forEach((warn: string) => console.warn(chalk.yellow(`   ⚠  ${warn}`)));

    console.error(chalk.gray(`\n   Tip: use only lowercase letters, numbers, and hyphens.`));
    console.error(chalk.gray(`   Example: `) + chalk.cyan(`npx zerithdb init my-cool-app`) + `\n`);

    process.exit(1);
  }
}
