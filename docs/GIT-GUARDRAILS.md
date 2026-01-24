# Git Guardrails (Anti-Drift)

This repo is intended to be maintained directly on `main`.

When multiple agents/tools work on the repo, drift happens when:

- someone commits on an old `main`
- someone pushes without pulling the latest `origin/main`
- context changes aren’t captured in commit messages

## Rules

1. **Always work on `main`**
2. **Before coding**: `git fetch origin` then `git status -sb`
3. **Before pushing**: ensure local `main` is up-to-date with `origin/main`

## Local enforcement (Husky)

This repo includes a `pre-push` hook that blocks pushes unless:

- you are on `main`
- `main` contains `origin/main` (i.e. you pulled latest)

If you really need to bypass locally (not recommended), you can set:

- `HUSKY=0` for that command

## Commit message context

Use `.gitmessage` as a commit template. It prompts for:

- **What changed**
- **Why**
- **How to verify**
- **Source prompt/agent** (optional)

Configure once per machine:

```sh
git config commit.template .gitmessage
```
