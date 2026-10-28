import { defineConfig } from 'vitest/config'

// Every package's TypeScript tests, from the collection root. Compiled copies in dist/ are never run.
export default defineConfig({ test: { include: ['src/**/*.test.ts', 'packages/*/src/**/*.test.ts'] } })
