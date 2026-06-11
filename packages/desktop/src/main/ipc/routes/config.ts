import type { TRPCBuilder } from '@trpc/server'
import type { AppConfig } from '../../store'

export function createConfigRouter(t: TRPCBuilder) {
  const router = t.router
  const procedure = t.procedure

  return router({
    get: procedure.query(opts => {
      return opts.ctx.configStore.store as AppConfig
    }),

    set: procedure
      .input((input: unknown): Partial<AppConfig> => {
        if (typeof input !== 'object' || input === null) {
          throw new Error('Invalid input: expected object')
        }
        return input as Partial<AppConfig>
      })
      .mutation(async opts => {
        const current = opts.ctx.configStore.store
        opts.ctx.configStore.store = { ...current, ...opts.input }
        return { success: true }
      }),
  })
}
