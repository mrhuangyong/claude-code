import type { TRPCBuilder } from '@trpc/server'
import type { CliMessage, CliStreamEvent } from '../../cli-protocol'

interface PendingChat {
  sessionId: string
  callbacks: Set<(event: CliStreamEvent) => void>
}

const pendingChats = new Map<string, PendingChat>()

export function createChatRouter(t: TRPCBuilder) {
  const router = t.router
  const procedure = t.procedure

  return router({
    sendMessage: procedure
      .input(
        (
          input: unknown,
        ): {
          id: string
          content: string
          attachments?: CliMessage['attachments']
        } => {
          if (typeof input !== 'object' || input === null) {
            throw new Error('Invalid input')
          }
          const data = input as Record<string, unknown>
          if (typeof data.id !== 'string' || typeof data.content !== 'string') {
            throw new Error('id and content are required strings')
          }
          return {
            id: data.id,
            content: data.content,
            attachments: data.attachments as
              | CliMessage['attachments']
              | undefined,
          }
        },
      )
      .mutation(async opts => {
        const { id, content, attachments } = opts.input
        const { cliPool } = opts.ctx

        if (!cliPool.has(id)) {
          await cliPool.spawn(id)
        }

        const callbacks = new Set<(event: CliStreamEvent) => void>()
        pendingChats.set(id, { sessionId: id, callbacks })

        const onData = (event: CliStreamEvent): void => {
          for (const cb of callbacks) {
            cb(event)
          }
        }

        cliPool.onData(id, onData)

        const message: CliMessage = {
          type: 'user_message',
          content,
          ...(attachments ? { attachments } : {}),
        }

        await cliPool.send(id, message)

        return { success: true, sessionId: id }
      }),

    abort: procedure
      .input((input: unknown): { id: string } => {
        if (typeof input !== 'object' || input === null) {
          throw new Error('Invalid input')
        }
        const data = input as Record<string, unknown>
        if (typeof data.id !== 'string') {
          throw new Error('id is required string')
        }
        return { id: data.id }
      })
      .mutation(async opts => {
        const { id } = opts.input
        const { cliPool } = opts.ctx

        const pending = pendingChats.get(id)
        if (pending) {
          pending.callbacks.clear()
          pendingChats.delete(id)
        }

        await cliPool.kill(id)

        return { success: true }
      }),

    onStreamEvent: procedure
      .input((input: unknown): { id: string } => {
        if (typeof input !== 'object' || input === null) {
          throw new Error('Invalid input')
        }
        const data = input as Record<string, unknown>
        if (typeof data.id !== 'string') {
          throw new Error('id is required string')
        }
        return { id: data.id }
      })
      .query(async opts => {
        const { id } = opts.input
        const { cliPool } = opts.ctx

        if (!cliPool.has(id)) {
          return { active: false }
        }

        return { active: true }
      }),
  })
}

export { pendingChats }
