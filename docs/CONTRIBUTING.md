# Contributing Guide

Thank you for your interest in contributing to this project! Please read this guide carefully before you start.

---

## Table of Contents

1. [Branch Workflow](#branch-workflow)
2. [Before You Contribute](#before-you-contribute)
3. [Commit Conventions](#commit-conventions)
4. [Submitting a Pull Request](#submitting-a-pull-request)

---

## Branch Workflow

We follow a structured branching model:

```
main
 └── dev
      └── <type>/description-#<issue-number>
```

| Branch | Purpose |
|---|---|
| `main` | Production-ready code. Only merged into via approved PRs from `dev`. Never commit directly. |
| `dev` | Integration branch. All feature branches are merged here first. |
| `<type>/description-#<issue>` | Short-lived branches for individual tasks, features, or fixes. |

### Branch Naming

Always branch off from `dev`. Use the following format:

```
<type>/<short-description>-#<issue-number>
```

**Types:**

| Type | Use For |
|---|---|
| `feat` | New features |
| `fix` | Bug fixes |
| `docs` | Documentation changes |
| `refactor` | Code restructuring without behavior change |
| `style` | Formatting, whitespace, CSS-only changes |
| `chore` | Tooling, config, dependency updates |
| `test` | Adding or updating tests |

**Examples:**

```bash
git checkout dev
git pull origin dev
git checkout -b feat/wallet-connect-#12
```

---

## Before You Contribute

1. **Fork or clone** the repository and ensure you are on the `dev` branch.
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the development server** and confirm the app runs locally:
   ```bash
   npm run dev
   ```
4. **Check for an existing issue** related to your contribution. If none exists, open one before starting work. This prevents duplicate effort and allows discussion before implementation.
5. **Pull the latest changes** from `dev` before starting:
   ```bash
   git pull origin dev
   ```

---

## Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<optional scope>): <short description>
```

- Use the **imperative mood** in the description (e.g., `add`, `fix`, `update` — not `added`, `fixed`, `updated`)
- Keep the description **under 72 characters**
- Do **not** end with a period

### Examples

```
feat(wallet): add Polkadot.js wallet connection
fix(navbar): correct mobile menu overflow issue
docs(contributing): add branch naming conventions
refactor(home): extract blob components into separate file
chore: update Next.js to v15.2
```

### Breaking Changes

If your change introduces a breaking change, append a `!` after the type and add a footer:

```
feat(api)!: change response shape for /tokens endpoint

BREAKING CHANGE: the `data` field is now a flat array instead of a paginated object.
```

---

## Submitting a Pull Request

1. **Ensure your branch is up to date** with `dev` before opening a PR:
   ```bash
   git fetch origin
   git rebase origin/dev
   ```

2. **Push your branch** to the remote:
   ```bash
   git push origin <your-branch-name>
   ```

3. **Open a Pull Request** targeting the `dev` branch — **never directly to `main`**.

4. **Fill in the PR template** with:
   - A clear title following commit conventions (e.g., `feat(home): add hero section animation`)
   - A description of what was changed and why
   - Screenshots or recordings for UI changes
   - A reference to the related issue (e.g., `Closes #12`)

5. **Request a review** from at least one team member.

6. **Address all review comments** before the PR is merged.

7. Once approved, the PR will be **squash-merged into `dev`** by a maintainer.

> **Note:** PRs from `dev` into `main` are managed exclusively by maintainers and represent production releases.
