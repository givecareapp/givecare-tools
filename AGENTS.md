# gc-tools Agent Rules

Type: reference.

This repo owns public TypeScript assessment, scoring, SMS, and geo helpers. Root
workspace `AGENTS.md` rules apply; this file adds local gates. Owner intent:
`/home/deploy/wiki/aims/givecare-instruments.md`.

## Authority

- The TypeScript instrument definitions own the public SDOH instruments. Downstream
  copies never edit them.
- `scripts/project-instruments.ts` is the only writer of `data/instruments-export.json`.
  Consumers bind its verified `givecare.artifact-ref/v1`.

## Required path

Change the TypeScript owner first, then regenerate and commit the projection on
`main` (`CLAUDE.md` § Projection flow).

## Proof

Run `npm run ci` and `npm run build` before handoff. Report only checks that ran.

## Safety

- Grow the public API only for demonstrated reuse.
- Keep the package dependency-free, I/O-free, and framework-free.
- No benefits catalog or eligibility engine, journey state machine, Mira runtime,
  memory, identity, prompts, turn planning, crisis classifier, or clinical decision
  support.
