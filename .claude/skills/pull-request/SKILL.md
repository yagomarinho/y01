---
name: pull-request
description: Prepares the pull request that takes a change into Y01's main (a feature, a fix, a refactoring, docs, tooling), because main changes only by merging a pull request on GitHub. Checks the terrain (the branch, a clean tree, origin/main merged into the branch when it is behind), runs the local checks, sweeps the docs and the roadmap for what the change makes stale, fills the PR body from .github/pull_request_template.md with the review of docs/process/pull-requests.md item by item (what the change is, the whole change green, the kernel rules, the public API, the docs), checks it with pnpm pr-review check-body, and after the user's yes pushes the branch and opens the PR with gh. Then suggests the self-review /code-review --comment and leaves the merge to the user's explicit yes. It makes no commit and no push on its own authority. Only the user runs it, with /pull-request.
argument-hint: '[the subject of the change, like kernel-transition or fix-interpreter-stale-fact]'
disable-model-invocation: true
---

# Pull request

`main` changes only by merging a pull request on GitHub (`docs/process/pull-requests.md`). This skill is the step before every PR, whatever it carries. It is the cheap part, and it is mandatory.

## Authorization

The user typing `/pull-request` authorizes **only preparing the PR**: the reads, the checks, the doc edits of the sweep and the PR body in a temporary file. It authorizes no commit and no push. Each of these waits for its own clear yes, and none implies another:

- **each commit:** the sync merge of `origin/main` into the branch, and the commit of the docs this skill touched;
- **pushing the branch and opening the PR;**
- **merging the PR** (`gh pr merge <n> --merge`), never with `--admin`, and never by auto-merge unless the user asks for it;
- **deleting the branch on `origin`** after the merge.

## Steps

### 1. Check the terrain

- **The branch.** `git branch --show-current` is the change's branch, never `main`: `feat/`, `fix/`, `refactor/`, `docs/` or `chore/<name>` (`docs/process/pull-requests.md`, section 1.1). If the work sits uncommitted on `main`, propose creating the branch from it (`git switch -c <type>/<name>`), with the user's yes. If unsure, ask.
- **A clean tree.** `git status` shows nothing but what belongs to this change. Anything else: stop and ask.
- **Up to date with `main`.** After `git fetch`, `git rev-list --count HEAD..origin/main`. When it is more than 0, propose `git merge --no-ff origin/main` (message `chore: sync <branch> with main`), never a rebase, as a commit that needs the user's yes; then the checks of step 2 again on the result.
- **The change is done.** Its tests exist and are green, and every behavior it adds started with a failing test (`CLAUDE.md`, TDD). If not, say what is missing.
- **What goes in:** `git log --oneline origin/main..HEAD` and `git diff --name-only origin/main...HEAD`, read to know what the change does and which roadmap item it advances.

### 2. Run the local checks

On the exact tip: `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`, each with its result. A docs-only change runs `pnpm test` only when it touched `scripts/` or the PR template. If dependencies are not installed, run `pnpm install` first.

### 3. Sweep the docs and the roadmap

- **The roadmap** (`docs/roadmap.md`, skill `roadmap`): the item the PR advances gets this PR in **Tracked in**; an item the merge completes moves to **Done** only after the merge, in a later docs PR.
- **The README, the `CLAUDE.md` and the process docs:** update only what this change makes false. A `CLAUDE.md` changes only when a rule, a command, a convention or a trap did.

### 4. Fill the PR body

**Never open a PR without this review, complete, for this exact tip.** Follow `docs/process/pull-requests.md`, section 2, item by item.

- **Read, don't assume.** Each item is a command run now or a read of the diff, with its result. A value taken from an earlier PR doesn't count.
- **The kernel rules** (section 3 of the body): search the diff of `src/` for the clock, randomness, network, file system, console and provider SDKs; for a `throw`; for configuration values; and for code that settles an open decision (`docs/roadmap.md`, decision items in **Now**). A hit is a finding for the user before the PR.
- **The public API** (section 4): `git diff origin/main...HEAD -- src/index.ts` and what it re-exports.
- **The body:** copy `.github/pull_request_template.md` to a temporary file outside the repository (the session's scratch folder), and fill it: the **Advances** line (`RMnn`, `fix: <what>`, `Process: <doc>`, and `Closes #n` when it closes an issue), and every item with its result after `—`. An item that doesn't apply says why. Only the user waives an item, with `**Waived** on YYYY-MM-DD by the user: <reason>`.
- **The title** is a Conventional Commit in English; it becomes the merge commit's title, with `(#<n>)`.
- **A blocking finding** (a red check, a broken kernel rule, an open decision taken by the code) stops the skill here: tell the user what it is and the fix. Don't open the PR around it.
- **Check the body:** `pnpm pr-review check-body <file>` prints `pr-review: ok`.

### 5. Ask for the docs' commit

When the sweep changed files: every relative link resolves, no secret got into a doc or the body, `pnpm exec prettier --write` on the Markdown it touched, then ask for one commit with only those files, `docs: prepare <subject> for review`. It needs the user's yes like any other.

### 6. Ask to push the branch and open the PR

Tell the user, briefly: the PR's title, what it advances, the checks it will run (`pr-body`, `checks`) and any item they waived. Then ask for the go-ahead to push the branch and open the PR, and stop there.

### 7. After the user's yes

1. **Push the branch:** `git push -u origin <branch>`. The `pre-push` hook refuses only a push to `main`; if it refuses, the branch is wrong: stop and read why, never `--no-verify`.
2. **Open the PR:** `gh pr create --base main --head <branch> --title "<title>" --body-file <file>` (`--draft` when the user wants it open early). Give the user the PR's URL.
3. **Suggest the self-review:** `/code-review --comment` on the PR. Each comment is answered (a fix in a new commit, with its own yes, or an explanation) and resolved; a new commit that changes what an item checked updates the body (`gh pr edit <n> --body-file <file>`, after `check-body`).
4. **The checks:** `gh pr checks <n>`; `pr-body` and `checks` must be green.
5. **The merge waits for the user's explicit yes:** with the checks green and every conversation resolved, ask; after a yes, `gh pr merge <n> --merge`. Never `--admin`, `--squash`, `--rebase`, or `--auto` unless the user asks.
6. **After the merge:** back on an updated `main` (`git switch main`, `git pull --ff-only origin main`), `git branch -d <branch>` (if it refuses, stop and ask, never `-D`), and ask to delete the branch on `origin` (`git push origin --delete <branch>`), which is a push and needs its own yes.
7. **Report:** the PR and its state, the findings, and what you could not verify.
