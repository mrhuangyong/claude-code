import { describe, test, expect, beforeEach, vi } from 'vitest'

const store = new Map<string, unknown>()

vi.mock('electron-store', () => ({
  default: class MockStore {
    constructor(opts: { defaults?: Record<string, unknown> }) {
      // Simulate electron-store: populate internal map with defaults on init
      if (opts.defaults) {
        for (const [key, value] of Object.entries(opts.defaults)) {
          store.set(key, value)
        }
      }
    }
    get(key: string) {
      return store.get(key)
    }
    set(key: string, value: unknown) {
      store.set(key, value)
    }
    get store() {
      return Object.fromEntries(store)
    }
  },
}))

describe('ConfigStore', () => {
  beforeEach(() => {
    store.clear()
    // Reset the module-level singleton so getConfigStore creates a fresh instance
    vi.resetModules()
  })

  test('returns default config values', async () => {
    const { getConfigStore } = await import('../store')
    const config = getConfigStore()
    const stored = config.store as Record<string, unknown>
    expect(stored).toHaveProperty('provider')
    expect(stored).toHaveProperty('model')
    expect(stored).toHaveProperty('theme')
  })

  test('set updates config value', async () => {
    const { getConfigStore } = await import('../store')
    const config = getConfigStore()
    config.set('model', 'claude-opus-4-7')
    expect(config.get('model')).toBe('claude-opus-4-7')
  })
})
