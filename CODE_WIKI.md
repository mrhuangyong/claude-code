# Claude Code Best (CCB) Code Wiki

## 1. 项目概述

### 1.1 项目简介
Claude Code Best (CCB) 是 Anthropic 官方 Claude Code CLI 工具的逆向工程开源项目。该项目旨在复现 Claude Code 的大部分功能和工程化能力，同时移除了官方版本的限制，支持自定义 API 配置、Bing 搜索、Debug 模式等增强功能。

- **版本**: 1.0.3
- **主要运行时**: Bun (>= 1.3.11)
- **类型**: ESM + TypeScript + React/Ink (TUI)

### 1.2 项目目标
- 完整复现 Claude Code 的核心功能
- 支持自定义 API 服务（兼容 Anthropic Messages API）
- 提供企业级监控上报功能
- 移除官方限制，增强可扩展性

---

## 2. 项目整体架构

### 2.1 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                     交互层 (TUI/CLI)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  REPL    │  │  Doctor  │  │  Resume  │  │Commands  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      UI 层 (React/Ink)                      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Components, Hooks, Design System                      │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    业务逻辑层 (Core Logic)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ QueryEngine  │  │   Tools      │  │  Commands    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                      状态管理层 (State)                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  AppState, Store, Selectors                             │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      服务层 (Services)                        │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │ API  │  │ MCP  │  │ LSP  │  │Voice │  │Policy│      │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘      │
├─────────────────────────────────────────────────────────────┤
│                      工具层 (Utils)                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Config, Auth, Git, File, Process, etc.               │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      基础设施层 (Infra)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Bridge     │  │   Remote     │  │   SSH        │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心流程

#### 2.2.1 启动流程
```
cli.tsx (入口)
  ├─ 快速路径处理 (--version, --dump-system-prompt, bridge, daemon, etc.)
  └─ main.tsx (完整 CLI)
      ├─ Commander.js 命令解析
      ├─ 初始化 (telemetry, config, trust dialog)
      ├─ 权限检查
      ├─ MCP 服务器连接
      ├─ 会话恢复
      └─ REPL 启动 (interactive mode) 或 Headless 模式
```

#### 2.2.2 对话循环流程
```
REPL.tsx (用户输入)
  └─ QueryEngine.ts (编排器)
      ├─ 构建系统/用户上下文
      ├─ query.ts (API 查询)
      │   ├─ 调用 Claude API
      │   ├─ 处理流式响应
      │   ├─ 工具调用处理
      │   └─ 对话回合管理
      ├─ 文件历史快照
      ├─ 归因记录
      └─ 会话存储
```

---

## 3. 主要模块职责

### 3.1 入口模块

#### 3.1.1 [src/entrypoints/cli.tsx](file:///workspace/src/entrypoints/cli.tsx)
**职责**: Bootstrap 入口点，处理特殊标志前的快速路径
- **关键功能**:
  - `--version`/`-v` 零模块加载快速路径
  - `--dump-system-prompt` (feature-gated)
  - `--claude-in-chrome-mcp` / `--chrome-native-host`
  - `remote-control` / `rc` / `bridge` (BRIDGE_MODE)
  - `daemon` (DAEMON)
  - `ps` / `logs` / `attach` / `kill` (BG_SESSIONS)
  - `--tmux` + `--worktree` 组合
  - 默认路径：加载 `main.tsx`

#### 3.1.2 [src/main.tsx](file:///workspace/src/main.tsx)
**职责**: 完整 CLI 入口，Commander.js 命令定义
- **关键功能**:
  - 注册大量子命令: `mcp`, `server`, `ssh`, `open`, `auth`, `plugin`, `agents`, `auto-mode`, `doctor`, `update` 等
  - 主 action 处理器：权限、MCP、会话恢复、REPL/Headless 模式分发
  - 初始化配置、认证、遥测等

#### 3.1.3 [src/entrypoints/init.ts](file:///workspace/src/entrypoints/init.ts)
**职责**: 一次性初始化 (遥测、配置、信任对话框)

### 3.2 核心对话引擎模块

#### 3.2.1 [src/query.ts](file:///workspace/src/query.ts)
**职责**: 主要 API 查询函数
- **关键功能**:
  - 发送消息到 Claude API
  - 处理流式响应
  - 处理工具调用
  - 管理对话回合循环

#### 3.2.2 [src/QueryEngine.ts](file:///workspace/src/QueryEngine.ts)
**职责**: 高级编排器，包装 `query()`
- **关键功能**:
  - 管理对话状态
  - 对话压缩
  - 文件历史快照
  - 归因记录
  - 回合级簿记

#### 3.2.3 [src/screens/REPL.tsx](file:///workspace/src/screens/REPL.tsx)
**职责**: 交互式 REPL 界面 (React/Ink 组件)
- **关键功能**:
  - 用户输入处理
  - 消息显示
  - 工具权限提示
  - 键盘快捷键

### 3.3 工具系统模块

#### 3.3.1 [src/Tool.ts](file:///workspace/src/Tool.ts)
**职责**: 工具接口定义和工具函数
- **关键类型**:
  - `Tool`: 核心工具接口
  - `ToolDef`: 工具定义 (buildTool 接受)
  - `Tools`: 工具集合
  - `ToolUseContext`: 工具使用上下文
  - `ToolPermissionContext`: 工具权限上下文

- **关键函数**:
  - `buildTool<D>()`: 构建完整 Tool 对象
  - `findToolByName()`: 通过名称查找工具
  - `toolMatchesName()`: 检查工具是否匹配名称

#### 3.3.2 [src/tools.ts](file:///workspace/src/tools.ts)
**职责**: 工具注册表
- **关键功能**:
  - 组装工具列表
  - 条件加载工具 (feature flags / process.env.USER_TYPE)

#### 3.3.3 工具目录 (src/tools/*/)
项目包含约 61 个工具，每个工具目录包含:
- `name`: 工具名称
- `description`: 工具描述
- `inputSchema`: Zod 输入模式
- `call()`: 工具执行函数
- 可选的 React 渲染组件

**主要工具类型**:
- BashTool: 执行 shell 命令
- FileEditTool: 编辑文件
- FileWriteTool: 写入文件
- ReadTool: 读取文件
- GrepTool: 搜索文本
- GlobTool: 文件匹配
- AgentTool: 子代理
- WebFetchTool: 网页获取
- WebSearchTool: 网页搜索 (Bing)
- LSPTool: LSP 集成
- MCPTool: MCP 工具
- ...更多工具

### 3.4 UI 层模块

#### 3.4.1 [src/ink.ts](file:///workspace/src/ink.ts)
**职责**: Ink 渲染包装器，注入 ThemeProvider

#### 3.4.2 [src/ink/](file:///workspace/src/ink/)
**职责**: 自定义 Ink 框架 (forked/internal)
- **关键组件**:
  - 自定义 reconciler
  - Hooks: `useInput`, `useTerminalSize`, `useSearchHighlight`
  - 虚拟列表渲染

#### 3.4.3 组件目录 (src/components/)
项目包含 170+ React 组件，关键组件:
- `App.tsx`: 根提供者 (AppState, Stats, FpsMetrics)
- `Messages.tsx` / `MessageRow.tsx`: 对话消息渲染
- `PromptInput/`: 用户输入处理
- `permissions/`: 工具权限审批 UI
- `design-system/`: 复用 UI 组件 (Dialog, FuzzyPicker, ProgressBar, ThemeProvider 等)

### 3.5 状态管理模块

#### 3.5.1 [src/state/AppState.tsx](file:///workspace/src/state/AppState.tsx)
**职责**: 中央应用状态类型和上下文提供者
- **包含内容**: 消息、工具、权限、MCP 连接等

#### 3.5.2 [src/state/AppStateStore.ts](file:///workspace/src/state/AppStateStore.ts)
**职责**: 默认状态和存储工厂

#### 3.5.3 [src/state/store.ts](file:///workspace/src/state/store.ts)
**职责**: Zustand 风格的 AppState 存储 (`createStore`)

#### 3.5.4 [src/state/selectors.ts](file:///workspace/src/state/selectors.ts)
**职责**: 状态选择器

#### 3.5.5 [src/bootstrap/state.ts](file:///workspace/src/bootstrap/state.ts)
**职责**: 会话全局状态的模块级单例
- **包含内容**: 会话 ID、CWD、项目根、token 计数、模型覆盖、客户端类型、权限模式

### 3.6 服务层模块

#### 3.6.1 API 服务 ([src/services/api/](file:///workspace/src/services/api/))
- **claude.ts**: 核心 API 客户端，构建请求参数，调用 Anthropic SDK 流式端点
- 支持多个提供商: Anthropic direct, AWS Bedrock, Google Vertex, Azure

#### 3.6.2 MCP 服务 ([src/services/mcp/](file:///workspace/src/services/mcp/))
- MCP 客户端、配置管理、官方注册表等

#### 3.6.3 其他服务
- `analytics/`: 分析/遥测 (GrowthBook, Sentry)
- `voice/`: 语音服务
- `lsp/`: LSP 服务器管理
- `policyLimits/`: 策略限制

### 3.7 基础设施模块

#### 3.7.1 Bridge/Remote Control ([src/bridge/](file:///workspace/src/bridge/))
- ~35 个文件，功能开关: BRIDGE_MODE
- **包含内容**: bridge API、会话管理、JWT 认证、消息传输、权限回调等
- **入口**: `bridgeMain.ts`
- **CLI 快速路径**: `claude remote-control` / `claude rc` / `claude bridge`

#### 3.7.2 Daemon 模式 ([src/daemon/](file:///workspace/src/daemon/))
- 功能开关: DAEMON
- **包含内容**: `main.ts` (入口) 和 `workerRegistry.ts` (worker 管理)

#### 3.7.3 SSH 远程 ([src/ssh/](file:///workspace/src/ssh/))
- SSH 会话管理

#### 3.7.4 Remote 会话 ([src/remote/](file:///workspace/src/remote/))
- 远程会话管理器、WebSocket 会话等

### 3.8 上下文和系统提示模块

#### 3.8.1 [src/context.ts](file:///workspace/src/context.ts)
**职责**: 构建 API 调用的系统/用户上下文
- **包含内容**: git 状态、日期、CLAUDE.md 内容、记忆文件

#### 3.8.2 [src/utils/claudemd.ts](file:///workspace/src/utils/claudemd.ts)
**职责**: 从项目层次结构发现和加载 CLAUDE.md 文件

---

## 4. 关键类与函数说明

### 4.1 核心引擎

#### QueryEngine 配置
```typescript
export type QueryEngineConfig = {
  cwd: string
  tools: Tools
  commands: Command[]
  mcpClients: MCPServerConnection[]
  agents: AgentDefinition[]
  canUseTool: CanUseToolFn
  getAppState: () => AppState
  setAppState: (f: (prev: AppState) => AppState) => void
  initialMessages?: Message[]
  readFileCache: FileStateCache
  customSystemPrompt?: string
  appendSystemPrompt?: string
  userSpecifiedModel?: string
  fallbackModel?: string
  thinkingConfig?: ThinkingConfig
  maxTurns?: number
  maxBudgetUsd?: number
  taskBudget?: { total: number }
}
```

### 4.2 工具接口

#### Tool 接口
```typescript
export type Tool<
  Input extends AnyObject = AnyObject,
  Output = unknown,
  P extends ToolProgressData = ToolProgressData,
> = {
  name: string
  aliases?: string[]
  searchHint?: string
  inputSchema: Input
  inputJSONSchema?: ToolInputJSONSchema
  outputSchema?: z.ZodType<unknown>
  
  call(
    args: z.infer<Input>,
    context: ToolUseContext,
    canUseTool: CanUseToolFn,
    parentMessage: AssistantMessage,
    onProgress?: ToolCallProgress<P>,
  ): Promise<ToolResult<Output>>
  
  description(
    input: z.infer<Input>,
    options: {
      isNonInteractiveSession: boolean
      toolPermissionContext: ToolPermissionContext
      tools: Tools
    },
  ): Promise<string>
  
  // 更多方法...
  isEnabled(): boolean
  isReadOnly(input: z.infer<Input>): boolean
  isDestructive?(input: z.infer<Input>): boolean
  checkPermissions(input: z.infer<Input>, context: ToolUseContext): Promise<PermissionResult>
  // ...
}
```

### 4.3 关键函数

| 函数名 | 文件 | 说明 |
|--------|------|------|
| `buildTool<D>()` | [Tool.ts](file:///workspace/src/Tool.ts#L783-L791) | 构建完整 Tool 对象，填充默认值 |
| `findToolByName()` | [Tool.ts](file:///workspace/src/Tool.ts#L358-L360) | 通过名称或别名查找工具 |
| `query()` | [query.ts](file:///workspace/src/query.ts) | 主要 API 查询函数 |
| `getSystemPrompt()` | [constants/prompts.ts](file:///workspace/src/constants/prompts.ts) | 获取系统提示 |
| `getTools()` | [tools.ts](file:///workspace/src/tools.ts) | 获取工具列表 |
| `getCommands()` | [commands.ts](file:///workspace/src/commands.ts) | 获取命令列表 |
| `feature()` | `bun:bundle` (内置) | 功能开关检查 |
| `enableConfigs()` | [utils/config.ts](file:///workspace/src/utils/config.ts) | 启用配置 |

---

## 5. 依赖关系

### 5.1 运行时依赖
虽然 `package.json` 中 `dependencies` 为空，但项目依赖大量开发依赖在运行时使用：

#### 核心框架
- **Bun**: 运行时 (>= 1.3.11)
- **React 19**: UI 框架
- **React Reconciler**: 自定义渲染器
- **Ink**: 终端 UI (forked 内部版本)
- **Commander.js**: CLI 命令解析

#### AI/LLM
- **@anthropic-ai/sdk**: Anthropic API SDK
- **@anthropic-ai/bedrock-sdk**: AWS Bedrock 集成
- **@anthropic-ai/vertex-sdk**: Google Vertex 集成
- **@anthropic-ai/claude-agent-sdk**: Agent SDK
- **@anthropic-ai/foundry-sdk**: Foundry SDK

#### MCP (Model Context Protocol)
- **@modelcontextprotocol/sdk**: MCP SDK
- **@anthropic-ai/mcpb**: MCP 相关

#### 工具库
- **zod**: 模式验证
- **axios**: HTTP 客户端
- **chalk**: 终端颜色
- **execa**: 子进程执行
- **lodash-es**: 工具函数
- **semver**: 版本管理
- **yaml**: YAML 解析
- **marked**: Markdown 解析
- **highlight.js**: 代码高亮
- **fuse.js**: 模糊搜索

#### 监控/分析
- **@sentry/node**: Sentry 错误上报
- **@growthbook/growthbook**: GrowthBook 特性开关
- **@opentelemetry/***: OpenTelemetry 监控

### 5.2 内部包 (Monorepo Workspaces)
项目使用 Bun workspaces，内部包位于 `packages/`:

| 包 | 说明 |
|----|------|
| `packages/audio-capture-napi/` | 音频捕获 NAPI (stub) |
| `packages/color-diff-napi/` | 颜色差异 NAPI (完整实现) |
| `packages/image-processor-napi/` | 图像处理 NAPI (stub) |
| `packages/modifiers-napi/` | 修改器 NAPI (stub) |
| `packages/url-handler-napi/` | URL 处理 NAPI (stub) |
| `packages/@ant/*` | Anthropic 内部包 (stub) |

### 5.3 模块依赖图 (简化)
```
cli.tsx
  └─ main.tsx
      ├─ query.ts
      │   ├─ QueryEngine.ts
      │   ├─ Tool.ts
      │   └─ services/api/claude.ts
      ├─ REPL.tsx
      │   ├─ components/*
      │   ├─ state/AppState.tsx
      │   └─ ink/*
      ├─ tools.ts
      │   └─ tools/*/
      ├─ commands.ts
      └─ utils/*
```

---

## 6. 功能开关 (Feature Flags)

### 6.1 使用方式
```typescript
import { feature } from 'bun:bundle'

if (feature('FLAG_NAME')) {
  // 功能启用
}
```

### 6.2 启用方式
通过环境变量 `FEATURE_<FLAG_NAME>=1` 启用:
```bash
FEATURE_BUDDY=1 FEATURE_FORK_SUBAGENT=1 bun run dev
```

### 6.3 主要功能开关

| Flag | 说明 |
|------|------|
| `BUDDY` | 小宠物功能 |
| `TRANSCRIPT_CLASSIFIER` | 自动模式分类器 |
| `BRIDGE_MODE` | 远程控制/Bridge 模式 |
| `AGENT_TRIGGERS_REMOTE` | Agent 触发远程 |
| `DAEMON` | 守护进程模式 |
| `BG_SESSIONS` | 后台会话 |
| `PROACTIVE` | 主动功能 |
| `KAIROS` | 助手模式 |
| `VOICE_MODE` | 语音模式 |
| `FORK_SUBAGENT` | 子代理分叉 |
| `SSH_REMOTE` | SSH 远程 |
| `DIRECT_CONNECT` | 直接连接 |
| `TEMPLATES` | 模板功能 |
| `CHICAGO_MCP` | Chicago MCP |
| `BYOC_ENVIRONMENT_RUNNER` | BYOC 环境运行器 |
| `SELF_HOSTED_RUNNER` | 自托管运行器 |
| `COORDINATOR_MODE` | 协调器模式 |
| `UDS_INBOX` | UDS 收件箱 |
| `LODESTONE` | Lodestone |
| `ABLATION_BASELINE` | 消融基线 |
| `DUMP_SYSTEM_PROMPT` | 转储系统提示 |

### 6.4 默认启用
- **Dev 模式** (`scripts/dev.ts`): `BUDDY`, `TRANSCRIPT_CLASSIFIER`, `BRIDGE_MODE`, `AGENT_TRIGGERS_REMOTE`
- **Build 模式** (`build.ts`): `AGENT_TRIGGERS_REMOTE`

---

## 7. 项目运行方式

### 7.1 环境要求
- **Bun**: >= 1.3.11 (必须最新版本)
- **Node.js**: (可选，构建产物兼容 Node.js)

### 7.2 安装依赖
```bash
bun install
```

### 7.3 开发模式
```bash
bun run dev
```
- 启动开发模式
- 版本号显示 888 表示正确
- 默认启用 4 个 feature flags

### 7.4 构建
```bash
bun run build
```
- 采用 code splitting 多文件打包
- 入口: `dist/cli.js`
- 约 450 个 chunk 文件
- 产物兼容 Bun 和 Node.js

### 7.5 首次配置 /login
首次运行后，在 REPL 中输入 `/login` 命令进入登录配置界面，选择 **Custom Platform** 即可对接第三方 API 兼容服务。

需要填写的字段：
| 字段 | 说明 | 示例 |
|------|------|------|
| Base URL | API 服务地址 | `https://api.example.com/v1` |
| API Key | 认证密钥 | `sk-xxx` |
| Haiku Model | 快速模型 ID | `claude-haiku-4-5-20251001` |
| Sonnet Model | 均衡模型 ID | `claude-sonnet-4-6` |
| Opus Model | 高性能模型 ID | `claude-opus-4-6` |

也可以直接编辑 `~/.claude/settings.json`:
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.example.com/v1",
    "ANTHROPIC_AUTH_TOKEN": "sk-xxx",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-4-5-20251001",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4-6",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-6"
  }
}
```

### 7.6 测试
```bash
bun test                      # 运行所有测试
bun test src/utils/__tests__/hash.test.ts   # 运行单个文件
bun test --coverage           # 带覆盖率报告
```

### 7.7 代码质量
```bash
bun run lint              # 检查
bun run lint:fix          # 自动修复
bun run format            # 格式化
bun run health            # 健康检查
bun run check:unused      # 检查未使用的导出
```

### 7.8 VS Code 调试
TUI (REPL) 模式需要真实终端，使用 **attach 模式**:

1. **终端启动 inspect 服务**:
   ```bash
   bun run dev:inspect
   ```
   会输出类似 `ws://localhost:8888/xxxxxxxx` 的地址。

2. **VS Code 附着调试器**:
   - 在 `src/` 文件中打断点
   - F5 → 选择 **"Attach to Bun (TUI debug)"**

---

## 8. 关键配置文件

### 8.1 [package.json](file:///workspace/package.json)
- 项目元数据、脚本、依赖
- `"type": "module"`: ESM 模块
- Workspaces: `packages/*`, `packages/@ant/*`
- Bin: `ccb`, `claude-code-best` → `dist/cli.js`

### 8.2 [tsconfig.json](file:///workspace/tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": false,
    "skipLibCheck": true,
    "paths": {
      "src/*": ["./src/*"]
    },
    "types": ["bun"]
  }
}
```

### 8.3 [biome.json](file:///workspace/biome.json)
- Biome 格式化/ lint 配置
- 大量规则被关闭 (decompiled 代码不适合严格 lint)
- `.tsx` 文件: 120 行宽 + 强制分号
- 其他文件: 80 行宽 + 按需分号

### 8.4 [build.ts](file:///workspace/build.ts)
- 构建脚本
- 使用 `Bun.build()` 并启用 `splitting: true`
- 入口: `src/entrypoints/cli.tsx`
- 输出: `dist/cli.js` + chunk 文件
- 默认启用 `AGENT_TRIGGERS_REMOTE` feature
- 后处理: 替换 `import.meta.require` 为 Node.js 兼容版本

### 8.5 [scripts/dev.ts](file:///workspace/scripts/dev.ts)
- 开发模式启动脚本
- 通过 Bun `-d` flag 注入 `MACRO.*` defines
- 运行 `src/entrypoints/cli.tsx`
- 默认启用 4 个 features: `BUDDY`, `TRANSCRIPT_CLASSIFIER`, `BRIDGE_MODE`, `AGENT_TRIGGERS_REMOTE`

### 8.6 [scripts/defines.ts](file:///workspace/scripts/defines.ts)
- 集中管理 MACRO defines
- 当前版本: `2.1.888`

---

## 9. 目录结构详解

```
/workspace/
├── docs/                          # 文档
│   ├── REVISION-PLAN.md
│   ├── auto-updater.md
│   ├── external-dependencies.md
│   ├── feature-exploration-plan.md
│   ├── lsp-integration.md
│   ├── projects-collection.md
│   ├── telemetry-remote-config-audit.md
│   ├── testing-spec.md
│   └── ultraplan-implementation.md
├── learn/                         # 学习资料
│   ├── LEARN.md
│   ├── phase-1-qa.md
│   ├── phase-1-startup-flow.md
│   ├── phase-2-conversation-loop.md
│   └── phase-2-qa.md
├── packages/                      # 内部包 (Bun workspaces)
│   ├── audio-capture-napi/
│   ├── color-diff-napi/
│   ├── image-processor-napi/
│   ├── modifiers-napi/
│   └── url-handler-napi/
├── scripts/                       # 脚本
│   ├── defines.ts
│   ├── dev-debug.ts
│   ├── dev.ts
│   ├── download-ripgrep.ts
│   └── health-check.ts
├── src/                           # 源代码
│   ├── __tests__/                 # 测试
│   ├── assistant/                 # 助手模式
│   ├── bootstrap/                 # 启动引导
│   ├── bridge/                    # Bridge/远程控制
│   ├── buddy/                     # 小宠物
│   ├── commands/                  # 命令
│   ├── constants/                 # 常量
│   ├── context/                   # 上下文
│   ├── coordinator/               # 协调器
│   ├── entrypoints/               # 入口点
│   │   ├── cli.tsx               # CLI 入口
│   │   ├── init.ts               # 初始化
│   │   └── ...
│   ├── environment-runner/        # 环境运行器
│   ├── hooks/                     # React Hooks (~100+)
│   ├── ink/                       # Ink 框架 (forked)
│   ├── jobs/                      # 任务
│   ├── keybindings/               # 快捷键
│   ├── memdir/                    # 记忆目录
│   ├── migrations/                # 迁移
│   ├── moreright/                 # MoreRight
│   ├── outputStyles/              # 输出样式
│   ├── plugins/                   # 插件
│   ├── proactive/                 # 主动功能
│   ├── remote/                    # 远程会话
│   ├── schemas/                   # 模式
│   ├── screens/                   # 屏幕
│   │   ├── Doctor.tsx
│   │   ├── REPL.tsx
│   │   └── ResumeConversation.tsx
│   ├── self-hosted-runner/        # 自托管运行器
│   ├── server/                    # 服务器
│   ├── services/                  # 服务
│   │   ├── analytics/             # 分析
│   │   ├── api/                   # API
│   │   ├── lsp/                   # LSP
│   │   ├── mcp/                   # MCP
│   │   ├── policyLimits/          # 策略限制
│   │   └── voice/                 # 语音
│   ├── skills/                    # 技能
│   ├── ssh/                       # SSH
│   ├── tools/                     # 工具 (~61 个)
│   │   ├── BashTool/
│   │   ├── FileEditTool/
│   │   ├── GrepTool/
│   │   ├── WebSearchTool/
│   │   └── ...
│   ├── types/                     # 类型定义
│   ├── upstreamproxy/             # 上游代理
│   ├── utils/                     # 工具函数 (~250+ 模块)
│   ├── vim/                       # Vim 模式
│   ├── QueryEngine.ts             # 查询引擎
│   ├── Task.ts                    # 任务
│   ├── Tool.ts                    # 工具接口
│   ├── commands.ts                # 命令
│   ├── context.ts                 # 上下文
│   ├── cost-tracker.ts            # 成本追踪
│   ├── history.ts                 # 历史
│   ├── ink.ts                     # Ink 包装器
│   ├── main.tsx                   # 主入口
│   ├── query.ts                   # 查询
│   └── tools.ts                   # 工具注册表
├── tests/                         # 测试
│   ├── integration/               # 集成测试
│   │   ├── cli-arguments.test.ts
│   │   ├── context-build.test.ts
│   │   ├── message-pipeline.test.ts
│   │   └── tool-chain.test.ts
│   └── mocks/                     # Mock
│       ├── api-responses.ts
│       └── file-system.ts
├── .githooks/                     # Git hooks
├── .editorconfig
├── .gitignore
├── CLAUDE.md                      # Claude Code 指南
├── DEV-LOG.md
├── README.md
├── README_EN.md
├── SECURITY.md
├── TODO.md
├── biome.json                     # Biome 配置
├── build.ts                       # 构建脚本
├── bunfig.toml
├── knip.json
├── mint.json                      # Mintlify 文档配置
├── package.json
└── tsconfig.json
```

---

## 10. 开发注意事项

### 10.1 不要修复所有 TSC 错误
约 1341 个 TSC 错误来自反编译 (主要是 `unknown`/`never`/`{}` 类型) — 这些**不**阻塞 Bun 运行时执行。

### 10.2 功能开关
- 默认全部关闭 (`feature()` 返回 `false`)
- Dev/build 各有自己的默认启用列表
- **不要**在 `cli.tsx` 中重定义 `feature` 函数
- 标准模式: `import { feature } from 'bun:bundle'` + `feature('FLAG_NAME')`

### 10.3 React Compiler 输出
组件有反编译的 memoization 样板代码 (`const $ = _c(N)`) — 这是正常的。

### 10.4 `bun:bundle` 导入
`import { feature } from 'bun:bundle'` 是 Bun 内置模块，由运行时/构建器解析。不要用自定义函数替代它。

### 10.5 `src/` 路径别名
tsconfig 映射 `src/*` 到 `./src/*`。像 `import { ... } from 'src/utils/...'` 这样的导入是有效的。

### 10.6 MACRO defines
集中管理在 `scripts/defines.ts`。Dev mode 通过 `bun -d` 注入，build 通过 `Bun.build({ define })` 注入。修改版本号等常量只改这个文件。

### 10.7 构建产物兼容 Node.js
`build.ts` 会自动后处理 `import.meta.require`，产物可直接用 `node dist/cli.js` 运行。

---

## 11. Stubbed/删除的模块

| 模块 | 状态 |
|------|------|
| Computer Use (`@ant/*`) | `packages/@ant/` 中的 stub 包 |
| `*-napi` packages (audio, image, url, modifiers) | `packages/` 中的 stubs (除 `color-diff-napi` 完整实现) |
| Analytics / GrowthBook / Sentry | 空实现 |
| Magic Docs / Voice Mode / LSP Server | 已删除 |
| Plugins / Marketplace | 已删除 |
| MCP OAuth | 简化 |

---

## 12. 版本历史

| 版本 | 说明 |
|------|------|
| V1 | 完成跑通及基本的类型检查通过 |
| V2 | 完整实现工程化配套设施，构建流水线完成 |
| V3 | 大量文档，完善文档站点 |
| V4 | 大量测试文件，提高稳定性；Buddy 回归，Auto Mode 回归 |
| V5 | 企业级监控上报功能，补全缺失工具，解除限制；移除反蒸馏代码，补全 web search 能力 |
| V6 (计划) | 大规模重构石山代码，全面模块分包 |

---

## 13. 相关资源

- **在线文档**: [ccb.agent-aura.top](https://ccb.agent-aura.top/)
- **GitHub**: [github.com/claude-code-best/claude-code](https://github.com/claude-code-best/claude-code)
- **Discord**: [discord.gg/qZU6zS7Q](https://discord.gg/qZU6zS7Q)
- **DeepWiki**: [deepwiki.com/claude-code-best/claude-code](https://deepwiki.com/claude-code-best/claude-code)

---

*本 Code Wiki 文档最后更新: 2026-04-03*
