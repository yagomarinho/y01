// The review of a pull request into main (docs/process/pull-requests.md).
// "check-body <file|->" validates a PR body filled from
// .github/pull_request_template.md: by hand before the PR is opened, and in
// the pr-body workflow. "pre-push" runs in the pre-push hook, which gets one
// line per pushed ref on stdin, and refuses any push to an existing main and
// the deletion of main: main only changes by merging a pull request. The only
// push to main it lets through is the one that creates it, the repository's
// first. It checks that the record exists and is complete; the review itself
// is the work of whoever fills it. Pure functions: the files and the terminal
// come in as parameters, from scripts/pr-review.cli.ts.

export const SECTIONS = 5

const PROTECTED_REF = 'refs/heads/main'
const ZERO_SHA = /^0+$/
const PROCESS_DOC = 'docs/process/pull-requests.md'
const USAGE =
  'usage: node scripts/pr-review.cli.ts check-body <file|-> | pre-push'

// what a body may cite as the work it advances: the keywords in any case, a
// roadmap item (RMnn) only in capitals
const CITATIONS = [/\bRM\d{2,}\b/, /\bfix: \S/i, /\bProcess: \S/i, /#\d+\b/]

const MISSING_ADVANCES =
  'missing the **Advances:** line (an RMnn item; fix: ...; Process: <doc>; or Closes #n)'

// a task list item as GitHub renders it: a -, * or + bullet, or numbered
const UNTICKED = /^\s*(?:[-*+]|\d+[.)]) \[ \]/
const TICKED = /^\s*(?:[-*+]|\d+[.)]) \[x\]/i

// the user's waiver, in full
const WAIVER = /\*\*Waived\*\* on \d{4}-\d{2}-\d{2} by the user: \S/

export interface Deps {
  readonly readFile: (file: string) => string
  readonly readStdin: () => string
  readonly log: (text: string) => void
  readonly error: (text: string) => void
}

// HTML comments and fenced code blocks are guidance or quotes, never items
const withoutComments = (text: string) =>
  text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^ {0,3}(```|~~~)[^\n]*\n[\s\S]*?^ {0,3}\1[^\n]*$/gm, '')

// the cited work, with the template's <placeholders> taken out
const advancesOf = (lines: readonly string[]) => {
  const found = lines.find(text => text.includes('**Advances:**'))

  if (found === undefined) return ''

  return found
    .slice(found.indexOf('**Advances:**') + '**Advances:**'.length)
    .replace(/<[^>]*>/g, '')
    .trim()
}

const cites = (text: string) => CITATIONS.some(citation => citation.test(text))

// the non-blank lines under each "## n. " heading, up to the next heading
const sectionsOf = (lines: readonly string[]) =>
  lines.reduce<{ sections: Map<number, string[]>; current: number | null }>(
    ({ sections, current }, text) => {
      const heading = /^## (\d+)\. /.exec(text)

      if (heading) {
        const n = Number(heading[1])

        return { sections: new Map(sections).set(n, []), current: n }
      }

      if (/^#{1,2} /.test(text)) return { sections, current: null }

      if (current === null || text.trim() === '') return { sections, current }

      const next = new Map(sections)

      next.set(current, [...(sections.get(current) ?? []), text])

      return { sections: next, current }
    },
    { sections: new Map(), current: null },
  ).sections

const sectionProblems = (sections: Map<number, string[]>) =>
  Array.from({ length: SECTIONS }, (_, i) => i + 1).flatMap(n => {
    const lines = sections.get(n)

    if (lines === undefined) return [`missing section ${n}`]

    return lines.length === 0 ? [`section ${n} is empty`] : []
  })

// a ticked item carries its result after the em dash; an unticked one only
// passes when the user waived it
const itemProblems = (lines: readonly string[]) =>
  lines.flatMap(text => {
    if (UNTICKED.test(text) && !WAIVER.test(text))
      return [`item without an answer: ${text.trim()}`]

    if (TICKED.test(text) && !/ — \S/.test(text))
      return [`ticked item without its result: ${text.trim()}`]

    return []
  })

// what a body lacks; an empty list when it is complete
export const problemsOf = (body: string) => {
  const lines = withoutComments(body).split(/\r?\n/)

  return [
    ...(cites(advancesOf(lines)) ? [] : [MISSING_ADVANCES]),
    ...sectionProblems(sectionsOf(lines)),
    ...itemProblems(lines),
  ]
}

// each stdin line: <local ref> <local sha> <remote ref> <remote sha>
export const refusedPushes = (input: string) =>
  input
    .split(/\r?\n/)
    .filter(Boolean)
    .map(text => text.split(' '))
    .filter(([, , remoteRef]) => remoteRef === PROTECTED_REF)
    .flatMap(([, localSha = '', , remoteSha = '']) => {
      if (ZERO_SHA.test(localSha)) return ['deleting main is never allowed']

      if (ZERO_SHA.test(remoteSha)) return []

      return [
        'push a branch (docs/, feat/, fix/, refactor/ or chore/) and open a pull request instead',
      ]
    })

const report = (
  where: string,
  problems: readonly string[],
  { error }: Pick<Deps, 'error'>,
) => {
  if (problems.length === 0) return true

  error(`pr-review: ${where}`)
  problems.forEach(problem => error(`  - ${problem}`))
  error(`  see ${PROCESS_DOC}`)

  return false
}

const checkBody = (body: string, deps: Deps) => {
  const ok = report(
    'the pull request body is incomplete',
    problemsOf(body),
    deps,
  )

  if (ok) deps.log('pr-review: ok')

  return ok
}

const prePush = (input: string, deps: Deps) =>
  report(
    'push refused: main only changes by merging a pull request',
    refusedPushes(input),
    deps,
  )

// the exit code of a command line
export const run = (argv: readonly string[], deps: Deps) => {
  const [command, file] = argv

  if (command === 'pre-push') return prePush(deps.readStdin(), deps) ? 0 : 1

  if (command === 'check-body' && file !== undefined) {
    const body = file === '-' ? deps.readStdin() : deps.readFile(file)

    return checkBody(body, deps) ? 0 : 1
  }

  deps.error(USAGE)

  return 2
}
