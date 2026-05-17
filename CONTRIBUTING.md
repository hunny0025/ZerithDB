# Contributing to ZerithDB

Thank you for your interest in ZerithDB! Every contribution — code, docs, tests, bug reports —
matters enormously.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Project Philosophy](#project-philosophy)
- [Development Setup](#development-setup)
- [Contribution Workflow](#contribution-workflow)
- [Coding Guidelines](#coding-guidelines)
- [Testing Strategy](#testing-strategy)
- [Issue Labels](#issue-labels)
- [Pull Request Checklist](#pull-request-checklist)
- [Release Process](#release-process)
- [Getting Help](#getting-help)

---

## Code of Conduct

ZerithDB follows the [Contributor Covenant v2.1](https://www.contributor-covenant.org/). Be kind and
constructive. Violations → `conduct@zerithdb.dev`

---

## Project Philosophy

1. **Developer experience above all.** If the API feels awkward, it's a bug.
2. **Simple defaults, powerful escapes.** Zero config covers 80%. The other 20% must be possible.
3. **Local-first is a feature.** Offline support is not an afterthought.
4. **Privacy by architecture.** We cannot see user data — by design, not policy.
5. **Monorepo discipline.** Each package must be independently usable. No circular dependencies.

---

## Development Setup

### Prerequisites

| Tool    | Min Version | Install                            |
| ------- | ----------- | ---------------------------------- |
| Node.js | 20.x        | [nodejs.org](https://nodejs.org)   |
| pnpm    | 9.x         | `npm i -g pnpm`                    |
| Git     | 2.x         | [git-scm.com](https://git-scm.com) |

### Step 1 — Fork & Clone

1. Click **Fork** on the top right of the [ZerithDB repo](https://github.com/Zerith-Labs/ZerithDB).
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/ZerithDB.git
cd ZerithDB
```

3. Add the upstream remote so you can sync with the main repo:

```bash
git remote add upstream https://github.com/Zerith-Labs/ZerithDB.git
```

### Step 2 — Install & Build

```bash
pnpm install       # install all dependencies
pnpm build         # build all packages
pnpm test          # verify your environment is working
pnpm dev           # start all packages in watch mode
```

### Step 3 — Keep Your Fork Up to Date

Before starting any work, always sync with upstream:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### Working on a Single Package

```bash
pnpm --filter zerithdb-db dev
pnpm --filter zerithdb-sync test
pnpm --filter zerithdb-sdk dev
```

### Common Setup Issues

| Problem | Fix |
|---------|-----|
| `pnpm install` fails | Make sure Node.js 20.x is installed |
| Build errors | Run `pnpm clean` then `pnpm build` again |
| Tests failing locally | Run `pnpm test --reporter=verbose` to see details |
| Port already in use | Kill the process using that port or change config |

---

## Contribution Workflow

### 1. Find or Create an Issue

- Browse [`good-first-issue`](https://github.com/Zerith-Labs/ZerithDB/issues?q=label%3Agood-first-issue) for beginner-friendly tasks.
- Browse [`help-wanted`](https://github.com/Zerith-Labs/ZerithDB/issues?q=label%3Ahelp-wanted) for higher priority tasks.
- For new features, open a **Discussion** before writing code.
- Comment `/assign` on an issue to claim it. Use `/unassign` if you can no longer work on it.
- **Do not open a PR without a linked issue** — it will be closed.

### 2. Create a Branch

Always branch off `main`:

```bash
git checkout main
git pull upstream main
git checkout -b fix/issue-42-db-crash
```

Branch naming convention:

```bash
git checkout -b feat/react-hooks         # new feature
git checkout -b fix/issue-42-db-crash    # bug fix
git checkout -b docs/sync-api-reference  # documentation
git checkout -b chore/update-yjs         # maintenance
git checkout -b test/add-crdt-tests      # tests only
```

### 3. Make Your Changes

- Keep PRs **focused** — one issue per PR.
- Write clear, readable code with comments where needed.
- Follow the [Coding Guidelines](#coding-guidelines) below.
- Run `pnpm lint` and `pnpm typecheck` before committing.

### 4. Commit with Conventional Commits

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`

**Scopes:** `db`, `sync`, `network`, `auth`, `sdk`, `cli`, `core`, `infra`

```bash
# Good examples
git commit -m "feat(db): add reactive live query support"
git commit -m "fix(sync): resolve race condition in CRDT merge"
git commit -m "docs(sdk): add TypeScript usage examples"
git commit -m "test(db): add regression test for write failures"

# Bad examples (avoid these)
git commit -m "fix stuff"
git commit -m "WIP"
git commit -m "updated files"
```

### 5. Push & Open a Pull Request

```bash
git push origin your-branch-name
```

Then go to GitHub and click **"Compare & pull request"**.

In your PR description:
- Reference the issue: `Closes #42`
- Explain **what** changed, **why**, and **how**
- Add screenshots for UI changes
- Fill out the PR checklist

---

## Coding Guidelines

### TypeScript (Strict)

- `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` — no exceptions.
- Explicit return types on all exported functions.
- No `any`. Use `unknown` and narrow appropriately.
- No non-null assertions (`!`) without an explanatory comment.
- No `ts-ignore` without a linked GitHub issue.

### Error Handling

```typescript
import { ZerithDBError, ErrorCode } from "zerithdb-core";
throw new ZerithDBError(ErrorCode.DB_WRITE_FAILED, `Failed to write to "${collection}"`, {
  cause: err,
});
```

### Exports

Each package exports only its public API from `src/index.ts`. Internal code lives in `src/internal/`
and is never exported.

### Code Style

- Use `pnpm format` to auto-fix formatting before committing.
- Use `pnpm lint` to catch style issues.
- Keep functions small and focused — if a function does more than one thing, split it.

---

## Testing Strategy

| Layer       | Tool       | Location                    |
| ----------- | ---------- | --------------------------- |
| Unit        | Vitest     | `packages/*/src/__tests__/` |
| Integration | Vitest     | `tests/integration/`        |
| E2E         | Playwright | `tests/e2e/`                |

```bash
pnpm test                    # run all tests
pnpm test --coverage         # with coverage report
pnpm test:e2e                # run Playwright E2E tests
pnpm --filter zerithdb-db test --watch   # watch mode for one package
```

**Rules:**

- Every bug fix **must** include a regression test.
- Every new public API **must** have unit tests.
- Test behavior, not implementation. Avoid mocking internal ZerithDB code.
- Aim for meaningful tests — 1 good test beats 10 trivial ones.

---

## Running Tests Locally

ZerithDB uses different layers of testing to ensure reliability across packages.

| Test Type | Tool | Location |
|------------|------|-----------|
| Unit Tests | Vitest | `packages/*/src/__tests__/` |
| Integration Tests | Vitest | `tests/integration/` |
| End-to-End (E2E) | Playwright | `tests/e2e/` |

---

### Run All Tests

```bash
pnpm test
```

Runs the complete test suite across all packages.

---

### Run Tests with Coverage

```bash
pnpm test --coverage
```

Generates a code coverage report for the repository.

---

### Run E2E Tests

```bash
pnpm test:e2e
```

Runs Playwright-powered browser tests.

Before running E2E tests for the first time, install Playwright browsers:

```bash
pnpm exec playwright install
```

---

### Run Tests in Watch Mode

```bash
pnpm --filter zerithdb-db test --watch
```

Useful during development for continuous feedback while editing code.

You can replace `zerithdb-db` with any workspace package.

---

### Run Tests for a Single Package

```bash
pnpm --filter zerithdb-db test
```

Examples:

```bash
pnpm --filter zerithdb-auth test
pnpm --filter zerithdb-network test
```

---

### Recommended Workflow

After making changes:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Ensure all checks pass before opening a pull request.

---

### Troubleshooting

#### Playwright browsers missing

```bash
pnpm exec playwright install
```

#### Dependency issues

```bash
rm -rf node_modules
pnpm install
```

#### Build errors

```bash
pnpm build
```

---

## Issue Labels

| Label              | Meaning                                          |
| ------------------ | ------------------------------------------------ |
| `good-first-issue` | Welcoming to newcomers — scoped and well-defined |
| `help-wanted`      | Core team needs community bandwidth              |
| `high-impact`      | Critical path for v1.0                           |
| `core`             | Changes to architecture or `zerithdb-core`       |
| `bug`              | Confirmed bug with reproduction steps            |
| `enhancement`      | New feature or improvement                       |
| `docs`             | Documentation only                               |
| `performance`      | Performance regression or improvement            |
| `breaking-change`  | Requires a major version bump                    |

---

## Pull Request Checklist

Before submitting your PR, make sure all of these pass:

- [ ] `pnpm test` passes with no failures
- [ ] `pnpm typecheck` shows no errors
- [ ] `pnpm lint` passes
- [ ] `pnpm format:check` passes
- [ ] New/changed public APIs have TSDoc comments
- [ ] Changeset added (`pnpm changeset`) if a published package changed
- [ ] PR is linked to an issue (`Closes #XX`)
- [ ] PR description explains **what**, **why**, and **how**
- [ ] No unrelated changes are included

---

## Release Process

ZerithDB uses [Changesets](https://github.com/changesets/changesets) for versioning.

When your PR changes a published package:

```bash
pnpm changeset
# 1. Select affected packages
# 2. Choose bump type (patch / minor / major)
# 3. Write a short change summary
# 4. Commit the generated .changeset/*.md file with your PR
```

> Maintainers handle the actual npm publish via the automated Release PR workflow.
> You don't need to publish anything manually.

---

## Getting Help

| Where | When |
| ----- | ---- |
| [GitHub Issues](https://github.com/Zerith-Labs/ZerithDB/issues) | Bug reports, feature requests |
| [GitHub Discussions](https://github.com/Zerith-Labs/ZerithDB/discussions) | Ideas, questions, feedback |
| [Discord `#contributors`](https://discord.gg/MhvuDvzWfF) | Real-time help from maintainers |

---

## First Time Contributing?

Not sure where to start? Here's a quick path:

1. ⭐ Star the repo
2. 📖 Read this guide fully
3. 🔍 Browse [`good-first-issue`](https://github.com/Zerith-Labs/ZerithDB/issues?q=label%3Agood-first-issue) issues
4. 💬 Comment `/assign` on an issue you like
5. 🍴 Fork, clone, and set up locally
6. 🔧 Make your fix
7. ✅ Run tests and linting
8. 🚀 Open a PR!

_Every line you write, every test you add, every doc you improve — it matters. Welcome to ZerithDB!_ 🎉
