// The shell of scripts/pr-review.ts: the files, stdin and the terminal.
// Node 22.18+ runs it directly (type stripping): node scripts/pr-review.cli.ts
import { readFileSync } from 'node:fs'

import { run } from './pr-review.ts'

process.exitCode = run(process.argv.slice(2), {
  readFile: file => readFileSync(file, 'utf8'),
  readStdin: () => readFileSync(0, 'utf8'),
  log: text => void process.stdout.write(`${text}\n`),
  error: text => void process.stderr.write(`${text}\n`),
})
