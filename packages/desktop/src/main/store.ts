import Store from 'electron-store'

export interface AppConfig {
  provider: 'anthropic' | 'openai' | 'gemini' | 'grok'
  apiKeys: Record<string, string>
  model: string
  baseUrl: string
  theme: 'light' | 'dark' | 'system'
  fontSize: number
  language: string
  sendOnEnter: boolean
}

const defaults: AppConfig = {
  provider: 'anthropic',
  apiKeys: {},
  model: 'claude-sonnet-4-6',
  baseUrl: '',
  theme: 'system',
  fontSize: 14,
  language: 'zh-CN',
  sendOnEnter: true,
}

let storeInstance: Store<AppConfig> | null = null

export function getConfigStore(): Store<AppConfig> {
  if (!storeInstance) {
    storeInstance = new Store<AppConfig>({
      name: 'config',
      defaults,
      encryptionKey: 'ccb-desktop-config-v1',
    })
  }
  return storeInstance
}
