import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

// Regression tests for scripts/check.sh: checker selection, exit statuses, changed mode,
// and the host slot pool. Each test copies the real script into a scratch repo whose
// node_modules/.bin holds stubs that log their calls, then runs it. The planted-error
// tests swap in the real tsrs and tsc binaries against a scratch project.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const script = join(repoRoot, 'scripts', 'check.sh')

const STUB = (name: string, exitWhen = '') => `#!/usr/bin/env bash
echo "${name} $*" >> "$CHECK_TEST_LOG"
${exitWhen ? `case " $* " in *" ${exitWhen} "*) exit 1 ;; esac` : ''}
`

const HELPER = `#!/usr/bin/env python3
import os, subprocess, sys
assert sys.argv[1:3] == ["run", "--"], sys.argv
with open(os.environ["CHECK_TEST_LOG"], "a") as log:
    log.write("helper run -- " + " ".join(sys.argv[3:]) + "\\n")
sys.exit(subprocess.run(sys.argv[3:]).returncode)
`

let root: string
let log: string
let bin: string

function stub(path: string, body: string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, body)
  chmodSync(path, 0o755)
}

function run(args: string[], env: Record<string, string | undefined> = {}) {
  const base: Record<string, string | undefined> = { ...process.env, CHECK_TEST_LOG: log, GIVECARE_HEAVY_SLOT_HELPER: '' }
  delete base.GC_TYPECHECKER
  delete base.GIVECARE_HEAVY_SLOT_HELD
  const result = spawnSync('bash', [join(root, 'scripts', 'check.sh'), ...args], { env: { ...base, ...env }, encoding: 'utf8' })
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, calls: calls() }
}

function calls(): string[] {
  try {
    return readFileSync(log, 'utf8').trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'gc-tools-check-'))
  log = join(root, 'calls.log')
  bin = join(root, 'node_modules', '.bin')
  mkdirSync(join(root, 'scripts'), { recursive: true })
  writeFileSync(join(root, 'scripts', 'check.sh'), readFileSync(script))
  chmodSync(join(root, 'scripts', 'check.sh'), 0o755)
  writeFileSync(join(root, 'tsconfig.json'), '{}\n')
  for (const tool of ['tsrs', 'tsc', 'vitest']) stub(join(bin, tool), STUB(tool))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('checker selection', () => {
  it('uses tsrs by default and tsc only when GC_TYPECHECKER=tsc', () => {
    expect(run(['typecheck']).calls).toEqual(['tsrs --version', 'tsrs --noEmit -p tsconfig.json'])
    rmSync(log)
    expect(run(['typecheck'], { GC_TYPECHECKER: 'tsc' }).calls).toEqual(['tsc --version', 'tsc --noEmit -p tsconfig.json'])
  })

  it('names the checker it runs', () => {
    expect(run(['typecheck'], { GC_TYPECHECKER: 'tsc' }).stderr).toContain('typecheck: tsc')
  })

  it('rejects any other spelling with exit 2 and runs nothing', () => {
    const result = run([], { GC_TYPECHECKER: 'tsgo' })
    expect(result.status).toBe(2)
    expect(result.stderr).toContain("GC_TYPECHECKER must be tsrs or tsc, not 'tsgo'")
    expect(result.calls).toEqual([])
  })

  it('fails with exit 1 when the selected checker is not installed, and runs nothing', () => {
    rmSync(join(bin, 'tsrs'))
    const result = run([])
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('tsrs is not installed')
    expect(result.calls).toEqual([])
  })
})

describe('exit statuses', () => {
  it("a checker's diagnostics are the gate's exit status and stop it before the tests", () => {
    stub(join(bin, 'tsrs'), STUB('tsrs', '--noEmit'))
    const result = run([])
    expect(result.status).toBe(1)
    expect(result.calls).toEqual(['tsrs --version', 'tsrs --noEmit -p tsconfig.json'])
    expect(result.calls.some(line => line.startsWith('vitest'))).toBe(false)
  })

  it('a failing tsrs is never retried with tsc', () => {
    stub(join(bin, 'tsrs'), STUB('tsrs', '--noEmit'))
    expect(run(['typecheck']).calls.some(line => line.startsWith('tsc'))).toBe(false)
  })

  it('an unknown subcommand exits 2', () => {
    const result = run(['lint'])
    expect(result.status).toBe(2)
    expect(result.stderr).toContain('usage: scripts/check.sh')
    expect(result.calls).toEqual([])
  })
})

describe('gate shape', () => {
  it('type-checks every workspace package project, and all of them before failing', () => {
    mkdirSync(join(root, 'packages', 'a'), { recursive: true })
    mkdirSync(join(root, 'packages', 'b'), { recursive: true })
    writeFileSync(join(root, 'packages', 'a', 'tsconfig.json'), '{}\n')
    writeFileSync(join(root, 'packages', 'b', 'tsconfig.json'), '{}\n')
    stub(join(bin, 'tsrs'), STUB('tsrs', 'packages/a/tsconfig.json'))
    const result = run(['typecheck'])
    expect(result.status).toBe(1)
    expect(result.calls).toEqual([
      'tsrs --version',
      'tsrs --noEmit -p tsconfig.json',
      'tsrs --noEmit -p packages/a/tsconfig.json',
      'tsrs --noEmit -p packages/b/tsconfig.json',
    ])
  })

  it('the full gate is the type check then every test', () => {
    const result = run([])
    expect(result.status).toBe(0)
    expect(result.calls).toEqual(['tsrs --version', 'tsrs --noEmit -p tsconfig.json', 'vitest run'])
  })

  it('changed mode runs the full gate and says so', () => {
    const result = run(['changed'])
    expect(result.status).toBe(0)
    expect(result.stderr).toContain('changed mode runs the full gate')
    expect(result.calls).toEqual(['tsrs --version', 'tsrs --noEmit -p tsconfig.json', 'vitest run'])
  })
})

describe('host slot pool', () => {
  it('every heavy step takes a slot when the workspace helper is present', () => {
    const helper = join(root, 'heavy_slot.py')
    stub(helper, HELPER)
    const result = run([], { GIVECARE_HEAVY_SLOT_HELPER: helper })
    expect(result.status).toBe(0)
    expect(result.calls).toEqual([
      'tsrs --version',
      `helper run -- ${bin}/tsrs --noEmit -p tsconfig.json`,
      'tsrs --noEmit -p tsconfig.json',
      `helper run -- ${bin}/vitest run`,
      'vitest run',
    ])
  })

  it('a standalone clone runs unthrottled and says so', () => {
    const result = run([], { GIVECARE_HEAVY_SLOT_HELPER: '' })
    expect(result.stderr).toContain('no host slot pool; heavy steps run unthrottled')
    expect(result.calls.some(line => line.startsWith('helper'))).toBe(false)
  })

  it('a helper path that does not exist is treated as standalone', () => {
    const result = run([], { GIVECARE_HEAVY_SLOT_HELPER: join(root, 'missing.py') })
    expect(result.status).toBe(0)
    expect(result.stderr).toContain('unthrottled')
  })
})

describe('planted errors with the real checkers', () => {
  // A scratch project with one type error in src/ and one in src/__tests__/, checked by the
  // repo's real tsrs and tsc. Proves both checkers see sources and tests and fail on them.
  function plant(checker: 'tsrs' | 'tsc') {
    rmSync(join(bin, checker))
    symlinkSync(realpathSync(join(repoRoot, 'node_modules', '.bin', checker)), join(bin, checker))
    writeFileSync(
      join(root, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'ES2022', moduleResolution: 'bundler', strict: true, skipLibCheck: true, noEmit: true }, include: ['src'] }),
    )
    mkdirSync(join(root, 'src', '__tests__'), { recursive: true })
    writeFileSync(join(root, 'src', 'bad.ts'), 'export const bad: number = "no"\n')
    writeFileSync(join(root, 'src', '__tests__', 'bad.test.ts'), 'export const badTest: string = 42\n')
    return run(['typecheck'], { GC_TYPECHECKER: checker })
  }

  it.each(['tsrs', 'tsc'] as const)('%s fails on a type error in src and in src/__tests__', checker => {
    const result = plant(checker)
    expect(result.status).not.toBe(0)
    expect(result.stdout + result.stderr).toMatch(/src\/bad\.ts\(1,14\): error TS2322/)
    expect(result.stdout + result.stderr).toMatch(/src\/__tests__\/bad\.test\.ts\(1,14\): error TS2322/)
  })
})
