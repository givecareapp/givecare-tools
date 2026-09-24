#!/usr/bin/env node
/**
 * Regenerates data/instruments-export.json from the owner source of truth
 * (src/assessments/instrumentExport.ts). Run this after changing an
 * instrument definition, inspect the diff, then commit on `main`.
 *
 * Consumers never run this script. They pin the committed bytes at an exact
 * gc-tools commit through the workspace `projection-ref` command
 * (capability `methods.assessment.project`) and verify the digest.
 */
import { closeSync, fchmodSync, fsyncSync, mkdtempSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildInstrumentExport } from '../src/assessments/instrumentExport.js'

const OUTPUT_PATH = 'data/instruments-export.json'
const OUTPUT_MODE = 0o644

function repoRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..')
}

function main(): void {
  const root = repoRoot()
  const target = resolve(root, OUTPUT_PATH)
  const directory = dirname(target)
  const content = Buffer.from(`${JSON.stringify(buildInstrumentExport(), null, 2)}\n`, 'utf8')

  const scratch = mkdtempSync(join(directory, '.instruments-export-'))
  const temporary = join(scratch, 'projection.json')
  let descriptor: number | null = null
  try {
    descriptor = openSync(temporary, 'wx', OUTPUT_MODE)
    writeFileSync(descriptor, content)
    fchmodSync(descriptor, OUTPUT_MODE)
    fsyncSync(descriptor)
    closeSync(descriptor)
    descriptor = null
    renameSync(temporary, target)
  } finally {
    if (descriptor !== null) closeSync(descriptor)
    rmSync(scratch, { recursive: true, force: true })
  }

  const sha256 = createHash('sha256').update(readFileSync(target)).digest('hex')
  process.stdout.write(`wrote ${OUTPUT_PATH} sha256:${sha256}\n`)
}

main()
