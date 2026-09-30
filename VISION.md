# gc-tools Vision

Type: explanation.

`gc-tools` is GiveCare's public TypeScript toolkit for assessment, scoring, SMS
regulatory behavior, quiet hours, and location helpers.

## Product promise

Small, deterministic functions make GiveCare's public methods inspectable and
reusable without exposing private Mira, runtime, or benefits infrastructure.

The toolkit should let an outside developer understand and reproduce a public
method without adopting GiveCare's private product architecture.

## Governing beliefs

- Public APIs should be small, deterministic, and unsurprising.
- Assessment meaning and scoring behavior should remain legible together.
- Public extraction is deliberate. The toolkit is not a mirror of the private
  runtime.
- Reuse justifies API growth; internal convenience alone does not.

## Direction

The toolkit should deepen around stable public assessment definitions and the
few utilities that are genuinely useful across products. Its surface should
become more trustworthy before it becomes broader.

## Success

`gc-tools` succeeds when an external consumer can reproduce GiveCare's public
assessment and utility behavior from clear deterministic APIs while private
caregiver state and live product judgment remain outside the package.

## Refusals

- Network, database, secret, or private-state behavior in public APIs.
- Benefits screening or runtime orchestration.
- Prompts, journey state, or private classifiers.
- Public API growth without demonstrated reuse.

## Document boundary

Public assessment meaning lives in [GC-SDOH.md](GC-SDOH.md). Code and operating
detail live in [CODEMAP.md](CODEMAP.md) and [CLAUDE.md](CLAUDE.md).
