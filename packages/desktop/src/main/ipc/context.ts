import type { CliProcessPool } from '../cli-pool'
import type { Store } from 'electron-store'
import type { AppConfig } from '../store'

export interface SessionStore {
  listSessions(): Array<{ id: string; createdAt: number }>
  createSession(): string
  deleteSession(id: string): void
  getHistory(id: string): Array<{ role: string; content: string }> | null
}

export interface AppContext {
  cliPool: CliProcessPool
  configStore: Store<AppConfig>
  sessionStore: SessionStore
}
