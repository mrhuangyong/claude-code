import type { Message } from '../../types/message.js';
import type { Tools } from '../../core/tools/Tool.js';

// UI适配器，用于处理与UI层的交互
export class UiAdapter {
  // 渲染工具使用消息
  renderToolUseMessage(tool: any, input: any, options: {
    theme: string;
    verbose: boolean;
    commands?: any[];
  }) {
    return tool.renderToolUseMessage(input, options);
  }

  // 渲染工具结果消息
  renderToolResultMessage(tool: any, content: any, progressMessages: any[], options: {
    style?: 'condensed';
    theme: string;
    tools: Tools;
    verbose: boolean;
    isTranscriptMode?: boolean;
    isBriefOnly?: boolean;
    input?: unknown;
  }) {
    return tool.renderToolResultMessage?.(content, progressMessages, options) || null;
  }

  // 渲染工具使用进度消息
  renderToolUseProgressMessage(tool: any, progressMessages: any[], options: {
    tools: Tools;
    verbose: boolean;
    terminalSize?: { columns: number; rows: number };
    inProgressToolCallCount?: number;
    isTranscriptMode?: boolean;
  }) {
    return tool.renderToolUseProgressMessage?.(progressMessages, options) || null;
  }
}

// 导出单例实例
export const uiAdapter = new UiAdapter();
