#!/usr/bin/env bash
# The gate. `check.sh` runs the type check and every test. `check.sh typecheck`
# runs only the type check. `check.sh changed` is the quick check after an edit;
# this suite runs in about two seconds, so changed mode is an alias for the full
# gate rather than a file selector: deletions, config, lockfile and generated
# data changes are always covered.
#
# GC_TYPECHECKER=tsc selects the retained tsc 7.1 compiler instead of tsrs, for
# compatibility checks or when tsrs is unavailable. It is never a silent
# fallback: the run names its checker, a missing checker fails, and a checker's
# diagnostics are its exit status.
#
# Heavy steps (type check, tests) take a slot from the workspace's host-wide
# pool when this checkout sits inside the GiveCare workspace. A standalone clone
# runs them unthrottled and says so.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
bin="$root/node_modules/.bin"

checker="${GC_TYPECHECKER:-tsrs}"
case "$checker" in
  tsrs | tsc) ;;
  *) echo "GC_TYPECHECKER must be tsrs or tsc, not '$checker'" >&2; exit 2 ;;
esac
if [[ ! -x "$bin/$checker" ]]; then
  echo "check: $checker is not installed in node_modules/.bin; run npm ci" >&2
  exit 1
fi
if [[ ! -x "$bin/vitest" ]]; then
  echo "check: vitest is not installed in node_modules/.bin; run npm ci" >&2
  exit 1
fi

# Host-wide slot pool (../scripts/heavy_slot.py; its docstring is the contract).
# GIVECARE_HEAVY_SLOT_HELPER="" or a clone without the workspace runs unthrottled.
helper="${GIVECARE_HEAVY_SLOT_HELPER-$root/../scripts/heavy_slot.py}"
if [[ -n "$helper" && ! -f "$helper" ]]; then helper=""; fi
if [[ -z "$helper" ]]; then echo "check: no host slot pool; heavy steps run unthrottled" >&2; fi

with_slot() {
  if [[ -n "$helper" ]]; then python3 "$helper" run -- "$@"; else "$@"; fi
}

typecheck() {
  echo "typecheck: $checker $("$bin/$checker" --version)" >&2
  with_slot "$bin/$checker" --noEmit -p tsconfig.json
}

full() {
  typecheck
  with_slot "$bin/vitest" run
}

case "${1:-}" in
  "") full ;;
  changed)
    echo "check: changed mode runs the full gate (small suite; deletions, config, lockfile and generated data are always covered)" >&2
    full ;;
  typecheck) typecheck ;;
  *) echo "usage: scripts/check.sh [changed | typecheck]" >&2; exit 2 ;;
esac
