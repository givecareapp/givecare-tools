import { defineConfig } from 'vitest/config'

// Only the TypeScript sources. Without this, Vitest also ran the compiled copies in dist/__tests__.
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } })
