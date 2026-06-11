import { describe, test, expect, beforeEach, vi } from 'vitest'
import { SessionStore } from '../session-store'
import { join } from 'node:path'

// In-memory file system to simulate write -> read round-trip
const memfs = new Map<string, string>()

vi.mock('node:fs', () => ({
  mkdirSync: vi.fn(),
  readdirSync: vi.fn((dir: string) => {
    const prefix = dir.endsWith('/') ? dir : `${dir}/`
    const files = new Set<string>()
    for (const key of memfs.keys()) {
      if (key.startsWith(prefix)) {
        const rest = key.slice(prefix.length)
        if (rest && !rest.includes('/')) {
          files.add(rest)
        }
      }
    }
    return [...files]
  }),
  readFileSync: vi.fn((filePath: string) => {
    if (!memfs.has(filePath)) {
      throw new Error(`ENOENT: no such file '${filePath}'`)
    }
    return memfs.get(filePath)!
  }),
  writeFileSync: vi.fn((filePath: string, data: string) => {
    memfs.set(filePath, data)
  }),
  unlinkSync: vi.fn((filePath: string) => {
    memfs.delete(filePath)
  }),
  existsSync: vi.fn((filePath: string) => memfs.has(filePath)),
}))

describe('SessionStore', () => {
  let store: SessionStore

  beforeEach(() => {
    memfs.clear()
    vi.clearAllMocks()
    store = new SessionStore('/tmp/test-sessions')
  })

  test('createSession returns a new session with id and title', () => {
    const session = store.createSession()
    expect(session).toHaveProperty('id')
    expect(session).toHaveProperty('title')
    expect(session).toHaveProperty('createdAt')
  })

  test('listSessions returns all sessions', () => {
    store.createSession()
    store.createSession()
    const sessions = store.listSessions()
    expect(sessions.length).toBeGreaterThanOrEqual(2)
  })

  test('deleteSession removes a session', () => {
    const session = store.createSession()
    store.deleteSession(session.id)
    const sessions = store.listSessions()
    expect(sessions.find(s => s.id === session.id)).toBeUndefined()
  })

  test('addMessage appends message to session history', () => {
    const session = store.createSession()
    store.addMessage(session.id, {
      id: 'msg-1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date().toISOString(),
    })
    const history = store.getHistory(session.id)
    expect(history).not.toBeNull()
    expect(history!.messages.length).toBe(1)
  })
})
