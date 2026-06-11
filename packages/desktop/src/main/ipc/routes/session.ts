import type { TRPCBuilder } from '@trpc/server'

export function createSessionRouter(t: TRPCBuilder) {
  const router = t.router
  const procedure = t.procedure

  return router({
    list: procedure.query(opts => {
      return opts.ctx.sessionStore.listSessions()
    }),

    create: procedure.mutation(opts => {
      const id = opts.ctx.sessionStore.createSession()
      return { id }
    }),

    delete: procedure
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
      .mutation(opts => {
        opts.ctx.sessionStore.deleteSession(opts.input.id)
        return { success: true }
      }),

    getHistory: procedure
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
      .query(opts => {
        return opts.ctx.sessionStore.getHistory(opts.input.id)
      }),
  })
}
