import { randomUUID } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

export interface Session {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface SessionHistory {
  session: Session
  messages: SessionMessage[]
}

export interface SessionMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  toolCalls?: SessionToolCall[]
}

export interface SessionToolCall {
  tool: string
  input: Record<string, unknown>
  output?: string
  status: 'running' | 'success' | 'error'
}

export class SessionStore {
  private dir: string

  constructor(baseDir: string) {
    this.dir = join(baseDir, 'sessions')
    if (!existsSync(this.dir)) {
      mkdirSync(this.dir, { recursive: true })
    }
  }

  createSession(title?: string): Session {
    const session: Session = {
      id: randomUUID(),
      title: title ?? '新对话',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const history: SessionHistory = { session, messages: [] }
    this.saveHistory(history)
    return session
  }

  listSessions(): Session[] {
    const files = readdirSync(this.dir).filter(f => f.endsWith('.json'))
    return files
      .map(f => {
        try {
          const data = JSON.parse(
            readFileSync(join(this.dir, f), 'utf-8'),
          ) as SessionHistory
          return data.session
        } catch {
          return null
        }
      })
      .filter((s): s is Session => s !== null)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
  }

  getHistory(sessionId: string): SessionHistory | null {
    const filePath = join(this.dir, `${sessionId}.json`)
    if (!existsSync(filePath)) return null
    try {
      return JSON.parse(readFileSync(filePath, 'utf-8')) as SessionHistory
    } catch {
      return null
    }
  }

  saveHistory(history: SessionHistory): void {
    history.session.updatedAt = new Date().toISOString()
    const filePath = join(this.dir, `${history.session.id}.json`)
    writeFileSync(filePath, JSON.stringify(history, null, 2), 'utf-8')
  }

  deleteSession(sessionId: string): void {
    const filePath = join(this.dir, `${sessionId}.json`)
    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
  }

  addMessage(sessionId: string, message: SessionMessage): void {
    const history = this.getHistory(sessionId)
    if (history) {
      history.messages.push(message)
      this.saveHistory(history)
    }
  }
}
