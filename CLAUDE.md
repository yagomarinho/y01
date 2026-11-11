# Y01

A single TypeScript package, `@y01/kernel`: a functional kernel for AI agents,
agnostic of infrastructure and application, with effects at the shell,
extensible through plugins. Open source, repository `yagomarinho/y01`.

**State:** new project, early design. Not published to npm (`private: true`
until the first release).

## Rules

- **Commit and push only with Yago's explicit authorization,** asked before
  each one; an approval covers only the commit or push it was given for.
- **`main` changes only by merging a pull request,** with a merge commit,
  after the review recorded in its body (`docs/process/pull-requests.md`).
  Every change goes on a short-lived `feat/`, `fix/`, `refactor/`, `docs/` or
  `chore/` branch; the project skill `pull-request` prepares the PR. The
  `pre-push` hook refuses a push to `main` (only the push that creates it goes
  through), and `--no-verify` is never used.
- **The kernel knows no infrastructure and no application.** No I/O, clock,
  randomness, network, database or logging inside `src/`: effects reach the
  kernel from the shell, through what the host provides at instantiation.
- **No configuration values in the middle of the code.** Limits, names and
  any value that can change outside the code reach the kernel as parameters.
  Production values are never silent defaults.
- **Errors are data,** returned as results, never thrown.
- **TDD.** Every new behavior starts with a failing test. The tests are the
  specification: never weaken one to make it pass; if one looks wrong, Yago
  decides.
- **Architecture decisions are Yago's.** Open questions (how effects enter the
  kernel, the plugin contract) are decided by him before code depends on them.

## Language

Everything in this repository is in English: code, comments, docs, this file
and commit messages. Conversation with Yago stays in Portuguese.

## Commands (Node 22.18+)

```bash
pnpm install
pnpm test                 # Jest; add a file pattern or -t "<test name>"
pnpm lint                 # eslint . (pnpm lint --fix also formats)
pnpm typecheck            # tsc --noEmit over src and __tests__
pnpm build                # tsc -p tsconfig.build.json, src only, to dist/
pnpm pr-review check-body <file>   # validates a PR body (pr-review: ok)
```

`pnpm install` also enables the hooks (`prepare` sets `core.hooksPath` to
`.githooks`).

## Structure

| Path                  | What it is                                         |
| --------------------- | -------------------------------------------------- |
| `src/`                | the kernel's source, the only thing built          |
| `__tests__/`          | unit tests, mirroring the folders, in `.spec.ts`   |
| `tsconfig.json`       | strict config for `src` and `__tests__`, no emit   |
| `tsconfig.build.json` | the build: `src` only, ESM with declarations       |
| `docs/roadmap.md`     | what Y01 intends to do next, in order (`RMnn`)     |
| `docs/process/`       | how a change reaches `main` (`pull-requests.md`)   |
| `scripts/`            | repository tooling: the PR review (`pr-review.ts`) |
| `.githooks/`          | the `pre-push` hook that protects `main`           |
| `.github/`            | the PR template and the `checks`, `pr-body` CI     |
| `.claude/skills/`     | the project skill `pull-request`                   |

`docs/roadmap.md` is kept with the personal skill `roadmap`: each item points
to the change that takes it, where its state lives.

## Conventions

- Prettier: no semicolons, single quotes, `trailingComma: all`,
  `arrowParens: avoid`, 80 columns, 2 spaces, LF. ESLint enforces it.
- Strict TypeScript (`noImplicitAny`, `exactOptionalPropertyTypes`,
  `noUncheckedIndexedAccess`, `verbatimModuleSyntax`); TypeScript pinned to
  `6.0.3`, since ts-jest doesn't accept 7 yet.
- ESM with NodeNext: relative imports carry the `.js` extension.
- File names in `dot.case` (`effect.handler.ts`); unused variables only with a
  `_` prefix; `no-console` is an error.
- Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`,
  `refactor:`, `test:`), with a bullet body when the change is large. Branches
  sync by merge, never by rebase.

## Tests

- Unit tests only: nothing calls the network, a model or a database; effects
  come in as fakes.
- Jest only transpiles (to CommonJS, on Node 22), so type tests
  (`@ts-expect-error`) are enforced by `pnpm typecheck`, not by `pnpm test`.
