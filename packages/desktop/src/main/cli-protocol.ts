export interface CliMessage {
  type: 'user_message'
  content: string
  attachments?: Array<{
    type: 'image' | 'file'
    name: string
    data: string // base64
    mediaType?: string
  }>
}

export interface CliStreamEvent {
  type: string
  id?: string
  delta?: { text?: string }
  block?: { type: string; text?: string }
  tool?: string
  input?: Record<string, unknown>
  output?: string
  error?: string
  message?: {
    role: string
    content: Array<{
      type: string
      text?: string
      name?: string
      input?: Record<string, unknown>
    }>
    model?: string
    usage?: { input_tokens: number; output_tokens: number }
  }
}

export interface CliConfig {
  provider?: string
  apiKey?: string
  model?: string
  baseUrl?: string
}
