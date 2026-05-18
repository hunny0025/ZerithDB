import path from "path";
import fs from "fs/promises";
import ora from "ora";
import chalk from "chalk";
import { execa } from "execa";
import prompts from "prompts";
import { validateProjectName, getProjectNameError } from "../validate-project-name.js";
import { writeFile } from "../utils/writeFile.js";

const TEMPLATES: Record<string, string> = {
  todo: "todo-app",
  chat: "chat-app",
  notes: "notes-app",
  blank: "blank",
};

export async function initCommand(
  appNameArg: string | undefined,
  options: { template: string; install: boolean }
): Promise<void> {
  // ── Step 1: App name ──────────────────────────────────────────────────────
  let appName = appNameArg;

  if (appName !== undefined) {
    // Passed as a CLI argument — validate and exit immediately if invalid.
    // validateProjectName() prints a friendly error and calls process.exit(1).
    validateProjectName(appName);
  }

  if (appName === undefined || appName.trim() === "") {
    // No name provided — prompt the user interactively.
    const response = await prompts({
      type: "text",
      name: "appName",
      message: "What is your app name?",
      initial: "my-zerithdb-app",
      // Re-use the same validation logic so the prompt gives inline feedback.
      validate: (v: string) => getProjectNameError(v) ?? true,
    });

    appName = response.appName as string;
  }

  if (appName === undefined || appName.trim() === "") {
    // User cancelled the prompt (Ctrl-C).
    console.log(chalk.red("Aborted."));
    process.exit(1);
  }

  // ── Step 2: Template selection ────────────────────────────────────────────
  let template = options.template;

  if (!(template in TEMPLATES)) {
    const response = await prompts({
      type: "select",
      name: "template",
      message: "Pick a starter template",
      choices: [
        { title: "✅  Todo App", value: "todo" },
        { title: "💬  Chat App", value: "chat" },
        { title: "📝  Notes App", value: "notes" },
        { title: "📦  Blank", value: "blank" },
      ],
    });

    template = response.template as string;
  }

  const targetDir = path.resolve(process.cwd(), appName);

  // ── Step 3: Scaffold ───────────────────────────────────────────────────────
  const spinner = ora().start();

  try {
    spinner.text = `Creating project directory for ${chalk.cyan(appName)}...`;
    await fs.mkdir(targetDir, { recursive: true });

    spinner.text = "Generating starter application files...";
    await scaffoldTemplate(targetDir, appName, template);

    spinner.succeed(`Created ${chalk.cyan(appName)} successfully`);
  } catch (err) {
    spinner.fail("Project scaffolding failed");

    // Cleanup: remove the directory if it's mostly empty (failed halfway)
    try {
      const files = await fs.readdir(targetDir);
      if (files.length < 3) {
        await fs.rm(targetDir, { recursive: true, force: true });
        console.log(chalk.gray("Cleaned up incomplete project directory."));
      }
    } catch {
      // Ignore cleanup errors
    }

    const message = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`Error: ${message}`));
    process.exit(1);
  }

  // ── Step 4: Install ────────────────────────────────────────────────────────
  if (options.install) {
    const installSpinner = ora("Installing project dependencies...").start();

    try {
      await execa("npm", ["install"], { cwd: targetDir });

      installSpinner.succeed("Dependencies installed successfully");
    } catch {
      installSpinner.warn("Dependency installation failed. Please run `npm install` manually.");
    }
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log(`
${chalk.green("✔")} ${chalk.bold("Your ZerithDB app is ready!")}

  ${chalk.gray("Get started:")}
  ${chalk.cyan(`1. cd "${appName}"`)}
  ${chalk.cyan("2. npm run dev")}

  ${chalk.gray("What's next:")}
  - Open ${chalk.blue("src/app/page.tsx")} to see the ZerithDB SDK in action.
  - Check out the ${chalk.blue("Live Playground")} at https://zerithdb.dev/playground
  - Need help? Join our ${chalk.blue("Discord")}: https://discord.gg/MhvuDvzWfF

  ${chalk.gray("Documentation:")} https://zerithdb.dev/docs
`);
}

async function scaffoldTemplate(
  targetDir: string,
  appName: string,
  template: string
): Promise<void> {
  // Write package.json
  const pkg = {
    name: appName,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
    },
    dependencies: {
      "zerithdb-sdk": "latest",
      next: "^14.2.0",
      react: "^18.3.0",
      "react-dom": "^18.3.0",
    },
    devDependencies: {
      typescript: "^5.5.0",
      "@types/react": "^18.3.0",
      "@types/node": "^22.0.0",
    },
  };

  try {
    await writeFile(targetDir, "package.json", JSON.stringify(pkg, null, 2));

    let indexContent: string;
    switch (template) {
      case "todo":
        indexContent = todoTemplate(appName);
        break;
      case "chat":
        indexContent = chatTemplate(appName);
        break;
      case "notes":
        indexContent = notesTemplate(appName);
        break;
      default:
        indexContent = blankTemplate(appName);
        break;
    }
    const layoutContent = layoutTemplate();

    await writeFile(targetDir, "src/app/page.tsx", indexContent);
    await writeFile(targetDir, "src/app/layout.tsx", layoutContent);

    // .gitignore
    await writeFile(targetDir, ".gitignore", "node_modules\n.next\ndist\n.env\n");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to write template files: ${message}`, { cause: err });
  }
}

function layoutTemplate(): string {
  return `"use client";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
}

function todoTemplate(appName: string): string {
  return `"use client";
// ${appName} — ZerithDB Todo App
// Generated by \`npx zerithdb init\`

import { createApp } from "zerithdb-sdk";

const app = createApp({
  appId: "${appName}",
});

app.sync.enable();

export default function App() {
  return <div>Hello from ZerithDB! Edit src/App.tsx to get started.</div>;
}
`;
}

function chatTemplate(appName: string): string {
  return `"use client";
// ${appName} — ZerithDB Chat App
// Generated by \`npx zerithdb init\`

import { createApp } from "zerithdb-sdk";

const app = createApp({
  appId: "${appName}",
});

app.sync.enable();

export default function App() {
  return (
    <div>
      <h1>ZerithDB Chat</h1>
      <p>Real-time P2P chat — no server required. Edit src/app/page.tsx to build your UI.</p>
    </div>
  );
}
`;
}

function notesTemplate(appName: string): string {
  return `"use client";
// ${appName} — ZerithDB Notes App
// Generated by \`npx zerithdb init\`

import { createApp } from "zerithdb-sdk";

const app = createApp({
  appId: "${appName}",
});

app.sync.enable();

export default function App() {
  return (
    <div>
      <h1>ZerithDB Notes</h1>
      <p>Local-first, synced notes — no backend. Edit src/app/page.tsx to build your UI.</p>
    </div>
  );
}
`;
}

function blankTemplate(appName: string): string {
  return `"use client";
// ${appName} — ZerithDB App
import { createApp } from "zerithdb-sdk";

const app = createApp({ appId: "${appName}" });

export default function App() {
  return <div>Hello ZerithDB!</div>;
}
`;
}
