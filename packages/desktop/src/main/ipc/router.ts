import { initTRPC } from '@trpc/server'
import type { AppContext } from './context'
import { createChatRouter } from './routes/chat'
import { createConfigRouter } from './routes/config'
import { createSessionRouter } from './routes/session'

const t = initTRPC.context<AppContext>().create()

export const appRouter = t.router({
  chat: createChatRouter(t),
  config: createConfigRouter(t),
  session: createSessionRouter(t),
})

export type AppRouter = typeof appRouter
