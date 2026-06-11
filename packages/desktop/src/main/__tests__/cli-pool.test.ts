import { describe, test, expect, vi, beforeEach } from 'vitest'
import { CliProcessPool } from '../cli-pool'
import type { CliMessage, CliStreamEvent } from '../cli-protocol'

const mockStdin = { write: vi.fn(), end: vi.fn() }
const mockStdout = { on: vi.fn() }
const mockProc = {
  stdin: mockStdin,
  stdout: mockStdout,
  stderr: { on: vi.fn() },
  on: vi.fn(),
  kill: vi.fn(),
  pid: 12345,
}

vi.mock('node:child_process', () => ({
  spawn: vi.fn(() => mockProc),
}))

describe('CliProcessPool', () => {
  let pool: CliProcessPool

  beforeEach(() => {
    vi.clearAllMocks()
    pool = new CliProcessPool('/mock/cli/path')
  })

  test('spawn creates a child process and returns session id', async () => {
    const sessionId = await pool.spawn()
    expect(sessionId).toBeTruthy()
    expect(typeof sessionId).toBe('string')
  })

  test('spawn uses provided session id', async () => {
    const customId = 'my-custom-session'
    const sessionId = await pool.spawn(customId)
    expect(sessionId).toBe(customId)
  })

  test('send writes JSONL message to process stdin', async () => {
    const sessionId = await pool.spawn()
    const msg: CliMessage = {
      type: 'user_message',
      content: 'Hello',
    }
    await pool.send(sessionId, msg)
    expect(mockStdin.write).toHaveBeenCalled()
    const written = mockStdin.write.mock.calls[0][0] as string
    expect(written).toContain('"type":"user_message"')
  })

  test('send throws if session does not exist', async () => {
    await expect(
      pool.send('nonexistent', { type: 'user_message', content: 'x' }),
    ).rejects.toThrow('No CLI process for session')
  })

  test('kill terminates the child process', async () => {
    const sessionId = await pool.spawn()
    await pool.kill(sessionId)
    expect(mockProc.kill).toHaveBeenCalled()
  })

  test('kill is safe to call on nonexistent session', async () => {
    await expect(pool.kill('nonexistent')).resolves.toBeUndefined()
  })

  test('has returns true for existing session', async () => {
    const sessionId = await pool.spawn()
    expect(pool.has(sessionId)).toBe(true)
  })

  test('has returns false for nonexistent session', async () => {
    expect(pool.has('nonexistent')).toBe(false)
  })

  test('onData registers callback for stream events', async () => {
    const sessionId = await pool.spawn()
    const callback = vi.fn()
    pool.onData(sessionId, callback)

    const dataHandler = mockStdout.on.mock.calls.find(
      (call: unknown[]) => (call as [string])[0] === 'data',
    )?.[1] as ((chunk: Buffer) => void) | undefined

    expect(dataHandler).toBeDefined()
    if (dataHandler) {
      dataHandler(
        Buffer.from('{"type":"content_block_delta","delta":{"text":"Hi"}}\n'),
      )
      expect(callback).toHaveBeenCalledWith({
        type: 'content_block_delta',
        delta: { text: 'Hi' },
      } as CliStreamEvent)
    }
  })

  test('offData removes callback', async () => {
    const sessionId = await pool.spawn()
    const callback = vi.fn()
    pool.onData(sessionId, callback)
    pool.offData(sessionId, callback)

    const dataHandler = mockStdout.on.mock.calls.find(
      (call: unknown[]) => (call as [string])[0] === 'data',
    )?.[1] as ((chunk: Buffer) => void) | undefined

    if (dataHandler) {
      dataHandler(
        Buffer.from('{"type":"content_block_delta","delta":{"text":"Hi"}}\n'),
      )
      expect(callback).not.toHaveBeenCalled()
    }
  })

  test('killAll terminates all processes', async () => {
    const id1 = await pool.spawn('s1')
    const id2 = await pool.spawn('s2')
    await pool.killAll()
    expect(mockProc.kill).toHaveBeenCalledTimes(2)
    expect(pool.has(id1)).toBe(false)
    expect(pool.has(id2)).toBe(false)
  })
})
