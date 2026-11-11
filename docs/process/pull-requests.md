# Pull requests

`main` changes **only by merging a pull request on GitHub**. Nothing is pushed to `main` directly: not code, not docs, not a one-line fix. Every change goes up on its own branch, opens a pull request (PR), passes the required checks and the review recorded in the PR body, and is merged by Yago with a merge commit.

The one exception is the repository's first commit, which creates `main`: there is nothing yet to open a PR against. The pre-push hook lets exactly that push through, and the branch rules (section 5) are applied right after it.

---

## 1. The flow

### 1.1. Branches

Every change has a short-lived branch named by its Conventional Commit type:

| Branch            | What goes on it                                    |
| ----------------- | -------------------------------------------------- |
| `feat/<name>`     | new behavior, with its tests                       |
| `fix/<name>`      | a fix, with the test that proves it                |
| `refactor/<name>` | a change of structure that keeps the behavior      |
| `docs/<name>`     | docs only: the roadmap, decisions, process, README |
| `chore/<name>`    | tooling, dependencies, CI                          |

`<name>` is a short slug of the change. The main folder rests on `main`; parallel work goes in worktrees under `.claude/worktrees/`.

### 1.2. One PR advances one thing

The body's **Advances** line cites what the PR moves forward: a roadmap item (`RM03`), a fix (`fix: <what>`), or, for a process or convention doc, `Process: <path>`. It may close a GitHub issue (`Closes #n`). A roadmap item that becomes a PR gets that PR in its **Tracked in** field, in the same PR.

### 1.3. Title, body and merge

- **The title is a Conventional Commit** in English: `feat: <what>`, `fix: <what>`, `docs: <what>`, `refactor: <what>`, `chore: <what>`.
- **The body** is `.github/pull_request_template.md`, filled: what it advances and the five sections of section 2, every item resolved. `pnpm pr-review check-body <file>` validates it locally, and the `pr-body` workflow validates it on GitHub.
- **The merge method is a merge commit,** never squash or rebase. The merge commit's title is the PR title plus `(#<n>)`. `git revert -m 1 <merge>` reverts a whole change at once.
- **The branch is up to date with `main` before the merge:** `origin/main` merged into the branch, never rebased, as an authorized commit (`chore: sync <branch> with main`). The required checks are strict, so GitHub refuses a PR behind `main`.

### 1.4. Authorization

Each of these needs its own clear yes from Yago, and none implies another:

- **each commit,** including the sync merge of `origin/main` into the branch;
- **pushing a branch and opening its PR** (`git push -u origin <branch>`, `gh pr create`);
- **merging the PR** (`gh pr merge <n> --merge`), never with `--admin`, and never by auto-merge unless Yago asks for it;
- **deleting the branch on `origin`** after the merge.

Typing `/pull-request` authorizes only preparing the PR: the checks and the body. It makes no commit and no push.

### 1.5. Self-review, visible

A solo maintainer cannot approve their own PR on GitHub, so required approvals are off. Instead, before the merge:

- the required checks are green (`pr-body`, `checks`);
- the self-review is recorded in the PR: `/code-review --comment` leaves its findings as review comments, and each one is answered (fixed in a new commit, or explained) and resolved;
- every conversation is resolved (GitHub refuses the merge otherwise).

---

## 2. The review: what the PR body records

The PR body has the five sections of the template. Each item is the result checked, with the command or the read that proved it; or "does not apply", with the reason; or Yago's waiver. An item without an answer blocks the PR. The review runs after the branch's last commit, before the PR is opened; a later commit that changes what an item checked updates that item.

1. **What the change is.** The files the PR changes (`git diff --name-only origin/main...HEAD`), and nothing unrelated among them; the roadmap item it advances, with its **Tracked in** pointing to the PR.
2. **The whole change, green.** The required checks on the PR's head, and `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` on the exact head, with their results.
3. **The kernel rules.** Nothing in `src/` reads the clock, draws a random number, touches the network, a database, the file system or the console; errors are returned as data; no configuration value sits in the middle of the code; and no open architecture decision (`CLAUDE.md`, "Architecture decisions are Yago's") is taken by the code.
4. **The public API.** What `src/index.ts` exports that was added, changed or removed, and every breaking change, named, with the version it needs.
5. **The docs.** The README, the `CLAUDE.md` and the process docs match the change; the roadmap items it moves, closes or adds (skill `roadmap`).

A **docs-only PR** keeps sections 1 and 5, and each of sections 2 to 4 holds one line: `Does not apply: docs-only pull request.`

Each ticked item gets its result on the same line, after an em dash (`—`); a waived item stays unticked, with the waiver on the same line:

```markdown
- [x] lint, typecheck, tests and build on the exact head — all green; `pnpm test` 30/30
- [ ] breaking changes, named, and the version they need — **Waived** on 2026-11-12 by the user: pre-release, nothing published
```

---

## 3. The checks and the guards

- **`scripts/pr-review.ts`** holds the rules as pure functions, tested in `__tests__/scripts/pr-review.spec.ts`; `scripts/pr-review.cli.ts` is its shell, run by Node 22.18+ directly (`pnpm pr-review <command>`).
- **`check-body <file|->`** validates a PR body: the sections `## 1.` to `## 5.` present and not empty, every ticked item with " — " and its result, every unticked item with the full waiver (`**Waived** on YYYY-MM-DD by the user: reason`), and the **Advances** line citing an `RMnn` (in capitals), a `fix:`, a `Process:` or an issue. HTML comments and fenced code blocks are ignored. It prints `pr-review: ok` or the problems, with exit 0 or 1.
- **`.github/workflows/pr-body.yml`** runs `check-body` on every PR to `main`, also when its title or body is edited, with read-only permissions and no secret. The body reaches the shell only through an environment variable, and the rule is checked out from the PR's base, so a PR cannot loosen the check that judges it.
- **`.github/workflows/checks.yml`** runs lint, typecheck, tests and build on every PR to `main` and on every push to `main` (the merges), with read-only permissions and no secret.
- **The `pre-push` hook** (`.githooks/pre-push`, which runs `pre-push`) refuses any push to an existing `main` and the deletion of `main`. It lets through only the push that creates `main`. `pnpm install` enables it (the `prepare` script sets `core.hooksPath` to `.githooks`); without an install, run `git config core.hooksPath .githooks` once. `git push --no-verify` skips it, and so it is never used.
- **The checks do not replace the review.** They only guarantee that the record exists and is complete.

---

## 4. The skill

The project skill `pull-request` (`.claude/skills/pull-request/`), run only by Yago with `/pull-request`, prepares a PR: it checks the branch and the tree, runs the local checks, fills the body item by item, validates it, and after Yago's yes pushes the branch and opens the PR. Then it suggests the self-review and leaves the merge to Yago.

---

## 5. Repository settings

Applied once by Yago, right after the first push, with `gh` authenticated in a clone of the repository (`{owner}` and `{repo}` are filled by `gh` from the clone's remote). The repository is public, so the ruleset is free.

1. **Merge methods:** only merge commits, titled by the PR.

   ```bash
   gh api -X PATCH repos/{owner}/{repo} -F allow_merge_commit=true -F allow_squash_merge=false -F allow_rebase_merge=false -F delete_branch_on_merge=false -f merge_commit_title=PR_TITLE -f merge_commit_message=PR_BODY
   ```

   Expected: a JSON with `"allow_merge_commit": true`, `"allow_squash_merge": false`, `"allow_rebase_merge": false` and `"merge_commit_title": "PR_TITLE"`.

2. **A ruleset on `main`:** require a PR (no required approvals, conversations resolved, merge commit only), require the checks `pr-body` and `checks` with the branch up to date, block force pushes and deletion, with no bypass actors. Save this as `ruleset.json` outside the repository:

   ```json
   {
     "name": "main",
     "target": "branch",
     "enforcement": "active",
     "conditions": {
       "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] }
     },
     "rules": [
       { "type": "deletion" },
       { "type": "non_fast_forward" },
       {
         "type": "pull_request",
         "parameters": {
           "required_approving_review_count": 0,
           "dismiss_stale_reviews_on_push": false,
           "require_code_owner_review": false,
           "require_last_push_approval": false,
           "required_review_thread_resolution": true,
           "allowed_merge_methods": ["merge"]
         }
       },
       {
         "type": "required_status_checks",
         "parameters": {
           "strict_required_status_checks_policy": true,
           "required_status_checks": [
             { "context": "pr-body" },
             { "context": "checks" }
           ]
         }
       }
     ]
   }
   ```

   ```bash
   gh api -X POST repos/{owner}/{repo}/rulesets --input ruleset.json
   gh api repos/{owner}/{repo}/rules/branches/main
   ```

   Expected: the first returns the ruleset with an `id` and `"enforcement": "active"`; the second lists `deletion`, `non_fast_forward`, `pull_request` and `required_status_checks`. The check names must match what the jobs report on a PR; `checks` runs on the first push to `main`, so it is known before the first PR.

---

## 6. The choices of this process

- **`main` changes only by merging a PR,** for every kind of change, because the PR keeps the history public in one place and lets GitHub enforce the checks.
- **Merge commits only;** sync by merge, never rebase or squash.
- **No required approvals** (a solo maintainer); the self-review is recorded in the PR instead.
- **The CI only checks.** It publishes nothing and uses no secret; publishing to npm is roadmap item RM10.
