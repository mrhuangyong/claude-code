import { describe, expect, test, beforeAll, afterAll } from 'bun:test'
import { renderableSearchText, toolUseSearchText, toolResultSearchText } from '../utils/transcriptSearch'
import type { RenderableMessage } from '../types/message'

// Define required constants locally to avoid dependency on messages.ts
const INTERRUPT_MESSAGE = '[Request interrupted by user]'
const INTERRUPT_MESSAGE_FOR_TOOL_USE = '[Request interrupted by user for tool use]'

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
      id: 'test-tool-use',
      name: 'Bash',
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
    content: [{ type: 'tool_result', tool_use_id: 'test-tool-use', content: '' }],
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
