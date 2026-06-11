import { spawn, type ChildProcess } from 'node:child_process'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { CliMessage, CliStreamEvent } from './cli-protocol'

interface ManagedProcess {
  proc: ChildProcess
  buffer: string
  callbacks: Set<(event: CliStreamEvent) => void>
}

export class CliProcessPool {
  private processes = new Map<string, ManagedProcess>()
  private cliPath: string

  constructor(cliPath?: string) {
    this.cliPath = cliPath ?? this.resolveCliPath()
  }

  private resolveCliPath(): string {
    if (process.resourcesPath) {
      return join(process.resourcesPath, 'cli', 'cli.js')
    }
    return join(__dirname, '..', '..', '..', '..', 'dist', 'cli.js')
  }

  async spawn(sessionId?: string): Promise<string> {
    const id = sessionId ?? randomUUID()
    const proc = spawn(
      'bun',
      [this.cliPath, '--print', '--output-format', 'stream-json'],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          FORCE_COLOR: '0',
          NO_COLOR: '1',
        },
      },
    )

    const managed: ManagedProcess = {
      proc,
      buffer: '',
      callbacks: new Set(),
    }

    proc.stdout.on('data', (chunk: Buffer) => {
      this.handleData(managed, chunk)
    })

    proc.stderr.on('data', (chunk: Buffer) => {
      console.error(`[CLI stderr] ${chunk.toString()}`)
    })

    proc.on('error', err => {
      console.error(`[CLI process error] ${err.message}`)
    })

    proc.on('exit', code => {
      console.log(`[CLI process exited] code=${code}`)
      this.processes.delete(id)
    })

    this.processes.set(id, managed)
    return id
  }

  private handleData(managed: ManagedProcess, chunk: Buffer): void {
    managed.buffer += chunk.toString()
    const lines = managed.buffer.split('\n')
    managed.buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const event = JSON.parse(trimmed) as CliStreamEvent
        for (const cb of managed.callbacks) {
          cb(event)
        }
      } catch {
        console.warn(`[CLI] Failed to parse: ${trimmed.slice(0, 100)}`)
      }
    }
  }

  async send(sessionId: string, message: CliMessage): Promise<void> {
    const managed = this.processes.get(sessionId)
    if (!managed) {
      throw new Error(`No CLI process for session: ${sessionId}`)
    }
    const line = JSON.stringify(message) + '\n'
    managed.proc.stdin.write(line)
  }

  onData(sessionId: string, callback: (event: CliStreamEvent) => void): void {
    const managed = this.processes.get(sessionId)
    if (!managed) {
      throw new Error(`No CLI process for session: ${sessionId}`)
    }
    managed.callbacks.add(callback)
  }

  offData(sessionId: string, callback: (event: CliStreamEvent) => void): void {
    const managed = this.processes.get(sessionId)
    if (managed) {
      managed.callbacks.delete(callback)
    }
  }

  async kill(sessionId: string): Promise<void> {
    const managed = this.processes.get(sessionId)
    if (managed) {
      managed.proc.kill('SIGTERM')
      this.processes.delete(sessionId)
    }
  }

  async killAll(): Promise<void> {
    for (const id of this.processes.keys()) {
      await this.kill(id)
    }
  }

  has(sessionId: string): boolean {
    return this.processes.has(sessionId)
  }
}
