# Contributing Guide

Thank you for contributing to Aniverse Nexus.

This guide explains the team's branch strategy, contribution rules, local setup expectations, and pull request standards.

## 1. Branch Workflow

The repository uses a simple staged flow:

```text
main
`-- dev
    `-- <type>/<short-description>-#<issue-number>
```

### Branch purposes

| Branch | Purpose |
| --- | --- |
| `main` | production-ready branch |
| `dev` | integration branch for active feature work |
| `feat/...`, `fix/...`, etc. | short-lived implementation branches |

### Rules

- do not commit directly to `main`
- branch from `dev`
- merge back into `dev` through a pull request

## 2. Branch Naming Convention

Use:

```text
<type>/<short-description>-#<issue-number>
```

### Allowed types

| Type | Use for |
| --- | --- |
| `feat` | new features |
| `fix` | bug fixes |
| `docs` | documentation changes |
| `refactor` | internal restructuring without behavior change |
| `style` | styling-only or formatting-only changes |
| `chore` | tooling or config updates |
| `test` | tests and validation work |

### Example

```bash
git checkout dev
git pull origin dev
git checkout -b feat/practice-targeting-#31
```

## 3. Before You Start

Before implementing anything:

1. pull the latest `dev`
2. check whether there is already an issue or task for the work
3. confirm whether your change affects:
   - frontend UI
   - gameplay logic
   - contract code
   - docs
4. read the relevant documentation in `docs/`

## 4. Local Setup Expectations

### Frontend

From the repo root:

```bash
npm install
npm run dev
```

### Contracts

From `contracts/`:

```bash
npm install
npm run compile
```

If your change affects deployment or pack logic, review:

- `docs/SETUP_AND_DEPLOYMENT.md`
- `docs/SMART_CONTRACTS.md`

## 5. Coding Expectations

### General expectations

- keep changes scoped to the task
- avoid unrelated refactors in the same pull request
- preserve the current product direction and feature boundaries
- document non-obvious behavior

### Frontend expectations

- keep mobile and desktop behavior in mind
- do not break the shared wallet flow
- keep game/tutorial copy consistent with the product language

### Gameplay expectations

- keep `cards.json` and battle logic aligned
- update gameplay documentation when rules change
- verify new states in both UI and battle engine where relevant

### Contract expectations

- keep deployment scripts in sync with contract changes
- avoid changing pack economics silently
- document any new events, env vars, or deployment steps

## 6. Commit Conventions

The repository follows Conventional Commits.

### Format

```text
<type>(<optional scope>): <short description>
```

### Good examples

```text
feat(practice): add target highlighting for legal attacks
fix(wallet): handle missing MetaMask provider gracefully
docs(readme): add deployment and demo instructions
refactor(deck): extract saved deck card component
```

### Guidelines

- use imperative mood
- keep the summary short and clear
- avoid ending the summary with a period

## 7. Pull Request Expectations

Every pull request should contain:

- a clear summary of what changed
- why the change was needed
- screenshots or recordings for UI changes
- testing notes
- linked issue or task if applicable

### Recommended PR checklist

- [ ] rebased or updated from `origin/dev`
- [ ] no unrelated files changed
- [ ] lint/build/test status noted
- [ ] screenshots included for visual changes
- [ ] docs updated when behavior changed

## 8. Review Standards

Reviewers should focus on:

- correctness
- regressions
- rule consistency
- responsive behavior
- contract/frontend alignment
- documentation accuracy

## 9. Documentation Rule

If you change one of these areas, update the docs:

| Area | Required docs |
| --- | --- |
| setup or env | `README.md`, `docs/SETUP_AND_DEPLOYMENT.md` |
| contracts | `docs/SMART_CONTRACTS.md` |
| gameplay | `docs/PRACTICE_BATTLE_SYSTEM.md` |
| product scope | `docs/HACKATHON_PROJECT_OVERVIEW.md` |

## 10. Release Flow

The team flow should be:

1. feature branches merge into `dev`
2. `dev` is validated
3. maintainers decide when `dev` is promoted to `main`

Only maintainers should manage production release merges.

