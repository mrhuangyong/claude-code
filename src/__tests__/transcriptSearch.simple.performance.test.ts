import { describe, expect, test } from 'bun:test'

// Mock the necessary types and dependencies
interface RenderableMessage {
  type: string
  id: string
  message: {
    id: string
    content: string | Array<{
      type: string
      text?: string
      input?: any
    }>
    role: string
    created_at: string
  }
  created_at: string
  updated_at: string
  toolUseResult?: any
  attachment?: any
  relevantMemories?: Array<{
    content: string
  }>
}

// Mock the necessary constants
const INTERRUPT_MESSAGE = '[Request interrupted by user]'
const INTERRUPT_MESSAGE_FOR_TOOL_USE = '[Request interrupted by user for tool use]'
const SYSTEM_REMINDER_CLOSE = '</system-reminder>'
const RENDERED_AS_SENTINEL = new Set([
  INTERRUPT_MESSAGE,
  INTERRUPT_MESSAGE_FOR_TOOL_USE,
])

// Copy the implementation from transcriptSearch.ts
const searchTextCache = new WeakMap<RenderableMessage, string>()

function computeSearchText(msg: RenderableMessage): string {
  let raw = ''
  switch (msg.type) {
    case 'user': {
      const c = msg.message.content
      if (typeof c === 'string') {
        raw = RENDERED_AS_SENTINEL.has(c) ? '' : c
      } else {
        const parts: string[] = []
        for (const b of c) {
          if (b.type === 'text') {
            if (!RENDERED_AS_SENTINEL.has(b.text!)) parts.push(b.text!)
          } else if (b.type === 'tool_result') {
            parts.push(toolResultSearchText(msg.toolUseResult))
          }
        }
        raw = parts.join('\n')
      }
      break
    }
    case 'assistant': {
      const c = msg.message.content
      if (Array.isArray(c)) {
        raw = c
          .flatMap(b => {
            if (b.type === 'text') return [b.text!]
            if (b.type === 'tool_use') return [toolUseSearchText(b.input)]
            return []
          })
          .join('\n')
      }
      break
    }
    case 'attachment': {
      if (msg.attachment?.type === 'relevant_memories') {
        raw = msg.attachment.memories.map(m => m.content).join('\n')
      } else if (
        msg.attachment?.type === 'queued_command' &&
        msg.attachment.commandMode !== 'task-notification' &&
        !msg.attachment.isMeta
      ) {
        const p = msg.attachment.prompt
        raw =
          typeof p === 'string'
            ? p
            : (p as any[]).flatMap(b => (b.type === 'text' ? [b.text] : [])).join('\n')
      }
      break
    }
    case 'collapsed_read_search': {
      if (msg.relevantMemories) {
        raw = msg.relevantMemories.map(m => m.content).join('\n')
      }
      break
    }
    default:
      break
  }
  let t = raw
  let open = t.indexOf('<system-reminder>')
  while (open >= 0) {
    const close = t.indexOf(SYSTEM_REMINDER_CLOSE, open)
    if (close < 0) break
    t = t.slice(0, open) + t.slice(close + SYSTEM_REMINDER_CLOSE.length)
    open = t.indexOf('<system-reminder>')
  }
  return t
}

export function renderableSearchText(msg: RenderableMessage): string {
  const cached = searchTextCache.get(msg)
  if (cached !== undefined) return cached
  const result = computeSearchText(msg).toLowerCase()
  searchTextCache.set(msg, result)
  return result
}

export function toolUseSearchText(input: unknown): string {
  if (!input || typeof input !== 'object') return ''
  const o = input as Record<string, unknown>
  const parts: string[] = []
  for (const k of [
    'command',
    'pattern',
    'file_path',
    'path',
    'prompt',
    'description',
    'query',
    'url',
    'skill',
  ]) {
    const v = o[k]
    if (typeof v === 'string') parts.push(v)
  }
  for (const k of ['args', 'files']) {
    const v = o[k]
    if (Array.isArray(v) && v.every(x => typeof x === 'string')) {
      parts.push((v as string[]).join(' '))
    }
  }
  return parts.join('\n')
}

export function toolResultSearchText(r: unknown): string {
  if (!r || typeof r !== 'object') return typeof r === 'string' ? r : ''
  const o = r as Record<string, unknown>
  if (typeof o.stdout === 'string') {
    const err = typeof o.stderr === 'string' ? o.stderr : ''
    return o.stdout + (err ? '\n' + err : '')
  }
  if (
    o.file &&
    typeof o.file === 'object' &&
    typeof (o.file as { content?: unknown }).content === 'string'
  ) {
    return (o.file as { content: string }).content
  }
  const parts: string[] = []
  for (const k of ['content', 'output', 'result', 'text', 'message']) {
    const v = o[k]
    if (typeof v === 'string') parts.push(v)
  }
  for (const k of ['filenames', 'lines', 'results']) {
    const v = o[k]
    if (Array.isArray(v) && v.every(x => typeof x === 'string')) {
      parts.push((v as string[]).join('\n'))
    }
  }
  return parts.join('\n')
}

// Mock messages for performance testing
const createMockUserMessage = (content: string): RenderableMessage => ({
  type: 'user',
  id: 'test-user-msg',
  message: {
    id: 'test-msg',
    content,
    role: 'user',
    created_at: new Date().toISOString(),
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

const createMockAssistantMessage = (content: string): RenderableMessage => ({
  type: 'assistant',
  id: 'test-assistant-msg',
  message: {
    id: 'test-msg',
    content: [{ type: 'text', text: content }],
    role: 'assistant',
    created_at: new Date().toISOString(),
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

const createMockToolUseMessage = (command: string): RenderableMessage => ({
  type: 'assistant',
  id: 'test-tool-use-msg',
  message: {
    id: 'test-msg',
    content: [{
      type: 'tool_use',
      input: { command },
    }],
    role: 'assistant',
    created_at: new Date().toISOString(),
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

const createMockToolResultMessage = (stdout: string, stderr: string): RenderableMessage => ({
  type: 'user',
  id: 'test-tool-result-msg',
  message: {
    id: 'test-msg',
    content: [{ type: 'tool_result' }],
    role: 'user',
    created_at: new Date().toISOString(),
  },
  toolUseResult: { stdout, stderr },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

describe('transcriptSearch performance', () => {
  test('renderableSearchText with WeakMap cache', () => {
    const mockMessage = createMockUserMessage('This is a test message for performance testing')
    
    // First call (should compute and cache)
    const startTime1 = performance.now()
    const result1 = renderableSearchText(mockMessage)
    const endTime1 = performance.now()
    const firstCallTime = endTime1 - startTime1
    
    // Second call (should use cache)
    const startTime2 = performance.now()
    const result2 = renderableSearchText(mockMessage)
    const endTime2 = performance.now()
    const secondCallTime = endTime2 - startTime2
    
    // Cache should provide a significant speedup
    expect(result1).toBe(result2)
    expect(secondCallTime).toBeLessThan(firstCallTime)
    console.log(`First call: ${firstCallTime.toFixed(2)}ms, Second call: ${secondCallTime.toFixed(2)}ms`)
  })
  
  test('renderableSearchText with large content', () => {
    // Create a large message content
    const largeContent = 'x'.repeat(100000) // 100,000 characters
    const mockMessage = createMockUserMessage(largeContent)
    
    // First call (should compute and cache)
    const startTime1 = performance.now()
    const result1 = renderableSearchText(mockMessage)
    const endTime1 = performance.now()
    const firstCallTime = endTime1 - startTime1
    
    // Second call (should use cache)
    const startTime2 = performance.now()
    const result2 = renderableSearchText(mockMessage)
    const endTime2 = performance.now()
    const secondCallTime = endTime2 - startTime2
    
    // Cache should provide a significant speedup even for large content
    expect(result1).toBe(result2)
    expect(secondCallTime).toBeLessThan(firstCallTime)
    console.log(`Large content - First call: ${firstCallTime.toFixed(2)}ms, Second call: ${secondCallTime.toFixed(2)}ms`)
  })
  
  test('toolUseSearchText performance', () => {
    const mockToolInput = {
      command: 'echo "Hello World" && ls -la && cat package.json',
      pattern: 'test',
      file_path: 'src/utils/transcriptSearch.ts',
      args: ['--verbose', '--recursive']
    }
    
    const startTime = performance.now()
    const result = toolUseSearchText(mockToolInput)
    const endTime = performance.now()
    const executionTime = endTime - startTime
    
    expect(result).toBeTruthy()
    console.log(`toolUseSearchText execution time: ${executionTime.toFixed(2)}ms`)
  })
  
  test('toolResultSearchText performance', () => {
    const mockToolResult = {
      stdout: 'Hello World\nThis is a test\n'.repeat(1000), // 1000 lines
      stderr: 'Some error messages\n'.repeat(100), // 100 error lines
      exitCode: 0
    }
    
    const startTime = performance.now()
    const result = toolResultSearchText(mockToolResult)
    const endTime = performance.now()
    const executionTime = endTime - startTime
    
    expect(result).toBeTruthy()
    console.log(`toolResultSearchText execution time: ${executionTime.toFixed(2)}ms`)
  })
  
  test('renderableSearchText with multiple message types', () => {
    const messages: RenderableMessage[] = [
      createMockUserMessage('User message'),
      createMockAssistantMessage('Assistant message'),
      createMockToolUseMessage('ls -la'),
      createMockToolResultMessage('File list', 'Error'),
    ]
    
    const startTime = performance.now()
    messages.forEach(msg => renderableSearchText(msg))
    // Second pass to test cache
    messages.forEach(msg => renderableSearchText(msg))
    const endTime = performance.now()
    const totalTime = endTime - startTime
    
    console.log(`Multiple message types with cache: ${totalTime.toFixed(2)}ms`)
  })
})
