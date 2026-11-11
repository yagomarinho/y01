import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  SECTIONS,
  problemsOf,
  refusedPushes,
  run,
} from '../../scripts/pr-review.ts'

const ZERO = '0000000000000000000000000000000000000000'
const SHA = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'

const section = (n: number, items: string[]) =>
  [`## ${n}. Section ${n}`, '', ...items, ''].join('\n')

const bodyWith = ({
  advances = '- **Advances:** RM03',
  items = (n: number) => [`- [x] item ${n} — checked, green`],
  skip = [] as number[],
}: {
  advances?: string
  items?: (n: number) => string[]
  skip?: number[]
} = {}) =>
  [
    'A summary of the change.',
    '',
    advances,
    '',
    ...Array.from({ length: SECTIONS }, (_, i) => i + 1)
      .filter(n => !skip.includes(n))
      .map(n => section(n, items(n))),
  ].join('\n')

const fakeDeps = (files: Record<string, string> = {}, stdin = '') => {
  const out: string[] = []
  const err: string[] = []

  return {
    out,
    err,
    deps: {
      readFile: (file: string) => files[file] ?? '',
      readStdin: () => stdin,
      log: (text: string) => void out.push(text),
      error: (text: string) => void err.push(text),
    },
  }
}

describe('problemsOf', () => {
  it('accepts a complete body', () => {
    expect(problemsOf(bodyWith())).toEqual([])
  })

  it.each([
    ['a roadmap item', 'RM03'],
    ['a fix', 'fix: the interpreter skips a fact'],
    ['a process doc', 'Process: docs/process/pull-requests.md'],
    ['an issue', 'Closes #4'],
  ])('accepts %s as what the PR advances', (_, cited) => {
    expect(
      problemsOf(bodyWith({ advances: `- **Advances:** ${cited}` })),
    ).toEqual([])
  })

  it('refuses a body without the Advances line', () => {
    expect(problemsOf(bodyWith({ advances: '' }))).toEqual([
      expect.stringContaining('**Advances:**'),
    ])
  })

  it('refuses the template placeholder as what the PR advances', () => {
    const advances = '- **Advances:** <RMnn | fix: what it fixes>'

    expect(problemsOf(bodyWith({ advances }))).toEqual([
      expect.stringContaining('**Advances:**'),
    ])
  })

  it('takes a register id only in capitals', () => {
    const advances = '- **Advances:** rm03'

    expect(problemsOf(bodyWith({ advances }))).toHaveLength(1)
  })

  it('refuses a missing section', () => {
    expect(problemsOf(bodyWith({ skip: [3] }))).toEqual(['missing section 3'])
  })

  it('refuses an empty section', () => {
    const items = (n: number) =>
      n === 2 ? [] : [`- [x] item ${n} — checked, green`]

    expect(problemsOf(bodyWith({ items }))).toEqual(['section 2 is empty'])
  })

  it('refuses an unticked item without a waiver', () => {
    const items = (n: number) => [`- [ ] item ${n}`]

    expect(problemsOf(bodyWith({ items }))).toHaveLength(SECTIONS)
  })

  it('accepts an unticked item the user waived', () => {
    const items = (n: number) => [
      `- [ ] item ${n} — **Waived** on 2026-11-11 by the user: not this time`,
    ]

    expect(problemsOf(bodyWith({ items }))).toEqual([])
  })

  it('refuses a ticked item without its result', () => {
    const items = (n: number) =>
      n === 1 ? ['- [x] item 1'] : [`- [x] item ${n} — checked`]

    expect(problemsOf(bodyWith({ items }))).toEqual([
      'ticked item without its result: - [x] item 1',
    ])
  })

  it('reads every task list marker GitHub renders', () => {
    const items = (n: number) => [
      `* [ ] a`,
      `+ [ ] b`,
      `${n}. [ ] c`,
      `1) [ ] d`,
    ]

    expect(problemsOf(bodyWith({ items }))).toHaveLength(SECTIONS * 4)
  })

  it('ignores HTML comments and fenced code blocks', () => {
    const items = (n: number) => [
      `- [x] item ${n} — checked`,
      '<!-- - [ ] a commented item -->',
      '```markdown',
      '- [ ] a quoted item',
      '```',
    ]

    expect(problemsOf(bodyWith({ items }))).toEqual([])
  })

  it('accepts a docs-only line in place of the items', () => {
    const items = (n: number) =>
      n === 1
        ? ['- [x] item 1 — docs only']
        : ['Does not apply: docs-only pull request.']

    expect(problemsOf(bodyWith({ items }))).toEqual([])
  })
})

describe('the pull request template', () => {
  const template = readFileSync(
    join(__dirname, '..', '..', '.github', 'pull_request_template.md'),
    'utf8',
  )

  it('has every section the check asks for', () => {
    const missing = problemsOf(template).filter((problem: string) =>
      problem.startsWith('missing section'),
    )

    expect(missing).toEqual([])
  })

  it('is refused until it is filled', () => {
    expect(problemsOf(template).length).toBeGreaterThan(0)
  })

  it('words no item with the em dash that separates a result', () => {
    const items = template
      .replace(/<!--[\s\S]*?-->/g, '')
      .split(/\r?\n/)
      .filter(text => /^\s*- \[ \]/.test(text))

    expect(items.filter(text => text.includes(' — '))).toEqual([])
  })
})

describe('refusedPushes', () => {
  const line = (localSha: string, remoteRef: string, remoteSha: string) =>
    `refs/heads/x ${localSha} ${remoteRef} ${remoteSha}`

  it('refuses a push to an existing main', () => {
    expect(refusedPushes(line(SHA, 'refs/heads/main', SHA))).toHaveLength(1)
  })

  it('allows the push that creates main', () => {
    expect(refusedPushes(line(SHA, 'refs/heads/main', ZERO))).toEqual([])
  })

  it('refuses deleting main', () => {
    expect(refusedPushes(line(ZERO, 'refs/heads/main', SHA))).toEqual([
      'deleting main is never allowed',
    ])
  })

  it('allows any other branch', () => {
    expect(refusedPushes(line(SHA, 'refs/heads/feat/kernel', SHA))).toEqual([])
  })

  it('allows a push of nothing', () => {
    expect(refusedPushes('')).toEqual([])
  })
})

describe('run', () => {
  it('prints ok and exits 0 for a complete body', () => {
    const { deps, out } = fakeDeps({ 'body.md': bodyWith() })

    expect(run(['check-body', 'body.md'], deps)).toBe(0)
    expect(out).toEqual(['pr-review: ok'])
  })

  it('reads the body from stdin with -', () => {
    const { deps } = fakeDeps({}, bodyWith())

    expect(run(['check-body', '-'], deps)).toBe(0)
  })

  it('lists the problems and exits 1 for an incomplete body', () => {
    const { deps, err } = fakeDeps({ 'body.md': bodyWith({ skip: [1] }) })

    expect(run(['check-body', 'body.md'], deps)).toBe(1)
    expect(err).toContain('  - missing section 1')
  })

  it('exits 1 for a refused push', () => {
    const stdin = `refs/heads/main ${SHA} refs/heads/main ${SHA}`
    const { deps } = fakeDeps({}, stdin)

    expect(run(['pre-push'], deps)).toBe(1)
  })

  it('exits 0 for an allowed push', () => {
    const stdin = `refs/heads/fix/x ${SHA} refs/heads/fix/x ${ZERO}`
    const { deps } = fakeDeps({}, stdin)

    expect(run(['pre-push'], deps)).toBe(0)
  })

  it('prints the usage and exits 2 for an unknown command', () => {
    const { deps, err } = fakeDeps()

    expect(run(['nothing'], deps)).toBe(2)
    expect(err[0]).toMatch(/^usage:/)
  })
})
