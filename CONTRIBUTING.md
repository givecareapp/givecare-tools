# Contributing

Type: how-to.

GiveCare Tools is a small, deterministic TypeScript package. It owns the public
GC-SDOH-6, GC-SDOH-30 and EMA-3 instrument definitions and the GiveCare Score.

## What belongs here

- Bug fixes to scoring, instrument definitions, or the instrument export.
- Documentation that makes an existing function clearer.
- Tests for existing behavior.

## What does not belong here

- New public API without a demonstrated consumer.
- Network, database, framework, or runtime code. The package stays I/O-free.
- Third-party instruments. Only GiveCare-owned instruments ship here (MIT).
- Changes to item wording, weights, thresholds, or bands without an
  accompanying rationale and evidence; those are instrument changes, not code
  changes, and are versioned.

## Before you open a pull request

```bash
npm ci
npm run check      # typecheck + tests
npm run build
```

If you change an instrument definition, run `npm run project:instruments` and
commit the regenerated `data/instruments-export.json` in the same change.

## Licensing

By contributing you agree your contribution is released under the MIT License.
