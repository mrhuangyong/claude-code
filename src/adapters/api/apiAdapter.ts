import { QueryEngine, ask } from '../../core/engine/QueryEngine.js';
import type { Tools } from '../../core/tools/Tool.js';

// API适配器，用于处理与外部API的交互
export class ApiAdapter {
  private queryEngine: QueryEngine | null = null;

  // 初始化QueryEngine
  initEngine(config: Parameters<typeof QueryEngine>[0]) {
    this.queryEngine = new QueryEngine(config);
    return this.queryEngine;
  }

  // 发送单个提示
  async *sendPrompt(config: Parameters<typeof ask>[0]) {
    yield* ask(config);
  }

  // 获取当前QueryEngine实例
  getEngine() {
    return this.queryEngine;
  }
}

// 导出单例实例
export const apiAdapter = new ApiAdapter();
