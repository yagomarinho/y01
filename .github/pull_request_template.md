<!--
The title is a Conventional Commit (feat: ..., docs: ...); the merge commit
is the title plus (#<n>).

Fill every section as docs/process/pull-requests.md says, and check the body
with: node scripts/pr-review.cli.ts check-body <file>   (must print pr-review: ok)

Each ticked item gets its result on the same line, after an em dash:
  - [x] lint, typecheck, tests and build on the exact head — `pnpm test` 30/30 green
A waived item stays unticked, with the user's note on the same line:
  - [ ] the public API — **Waived** on YYYY-MM-DD by the user: reason
A docs-only pull request keeps sections 1 and 5 and replaces the items of
sections 2 to 4 with one line each:
  Does not apply: docs-only pull request.

The self-review comes after the PR is opened (/code-review --comment): its
comments are answered or resolved before the merge. Editing this body re-runs
the pr-body check.
-->

<summary of the change in one or two sentences>

- **Advances:** <RMnn | fix: what it fixes | Process: the doc's path> <Closes #n, when it closes an issue>

## 1. What the change is

- [ ] the PR's files (`git diff --name-only origin/main...HEAD`), and nothing else in them
- [ ] the roadmap item it advances, with its "Tracked in" pointing to this PR

## 2. The whole change, green

- [ ] the required checks (`pr-body`, `checks`) green on the PR's head
- [ ] lint, typecheck, tests and build on the exact head

## 3. The kernel rules

- [ ] no I/O, clock, randomness, network, database or console in `src/`
- [ ] errors returned as data, never thrown
- [ ] no configuration value in the middle of the code
- [ ] no open architecture decision taken by the code

## 4. The public API

- [ ] what `src/index.ts` exports, added, changed or removed
- [ ] breaking changes, named, and the version they need

## 5. The docs

- [ ] README, `CLAUDE.md` and the process docs match the change
- [ ] the roadmap: items moved, closed or added by this change
