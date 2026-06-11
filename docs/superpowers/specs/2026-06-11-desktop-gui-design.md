# GUI Desktop App Design

## Overview

Build a cross-platform desktop GUI application wrapping the Claude Code Best CLI as a user-friendly AI assistant. Target audience: non-technical users who want a ChatGPT/Claude Desktop-like experience without touching the command line.

**Architecture**: Electron shell + React renderer, CLI core invoked as subprocess via JSON Lines protocol.

**Platforms**: macOS, Windows, Linux.

## Architecture: Approach A — Electron + CLI Subprocess

```
┌─────────────────────────────────────┐
│           Electron Shell            │
│  ┌───────────┐  ┌────────────────┐  │
│  │ Main 进程  │  │  React UI      │  │
│  │ (Node.js) │◄─►│  (Chromium)    │  │
│  │ - 窗口管理 │IPC│ - 聊天界面     │  │
│  │ - 文件系统 │  │ - Artifacts    │  │
│  │ - 原生菜单 │  │ - 设置面板     │  │
│  └─────┬─────┘  └────────────────┘  │
│        │ spawn + JSON Lines          │
│  ┌─────▼─────┐                      │
│  │ dist/cli.js│                     │
│  │ (API层+工具)│                     │
│  └───────────┘                      │
└─────────────────────────────────────┘
```

**Why subprocess, not direct import**: CLI code depends on Bun-specific APIs (`bun:bundle`, `Bun.spawn`, `Bun.file`). Porting to Electron's Node.js runtime would be high-risk and high-cost. The subprocess approach keeps CLI independently updatable.

## Directory Structure

```
packages/desktop/
├── package.json
├── electron-builder.yml
├── electron.vite.config.ts          # electron-vite unified config
├── tsconfig.json
├── resources/
│   ├── icon.icns                    # macOS
│   ├── icon.ico                     # Windows
│   └── icon.png                     # Linux
├── src/
│   ├── main/                        # Electron main process
│   │   ├── index.ts                 # Entry: create window, register IPC
│   │   ├── ipc/
│   │   │   ├── chat.ts             # Chat: send, stream, abort
│   │   │   ├── config.ts           # Config: API keys, model selection
│   │   │   ├── files.ts            # Files: upload, export
│   │   │   └── tools.ts            # Tool call management
│   │   ├── cli-pool.ts             # CLI subprocess pool manager
│   │   ├── tray.ts                 # System tray
│   │   ├── menu.ts                 # Native menu bar
│   │   ├── updater.ts             # Auto-update (electron-updater)
│   │   └── store.ts               # electron-store persistent config
│   ├── preload/
│   │   └── index.ts                # contextBridge API
│   └── renderer/
│       ├── index.html
│       ├── main.tsx                # React entry
│       ├── App.tsx                 # Root component
│       ├── components/
│       │   ├── chat/               # Chat UI
│       │   ├── artifacts/          # Artifacts rendering panel
│       │   ├── settings/           # Settings panel
│       │   ├── sidebar/            # Session list sidebar
│       │   └── common/             # Shared components
│       ├── hooks/
│       ├── stores/                 # Zustand state management
│       ├── lib/                    # Utilities
│       └── styles/                 # Global styles
```

## Core Architecture

### Main ↔ CLI Communication (JSON Lines)

Main process spawns `dist/cli.js` with `--pipe` mode. Communication via stdin/stdout using JSON Lines protocol:

```jsonl
{"type": "chat.send", "id": "uuid", "messages": [...], "model": "claude-sonnet-4-6", "provider": "anthropic"}
{"type": "content_block_start", "id": "uuid", "block": {"type": "text", "text": ""}}
{"type": "content_block_delta", "id": "uuid", "delta": {"text": "Hello"}}
{"type": "tool_use", "id": "uuid", "tool": "Bash", "input": {"command": "ls"}}
{"type": "tool_result", "id": "uuid", "output": "file1.txt\nfile2.txt"}
{"type": "message_stop", "id": "uuid"}
{"type": "chat.abort", "id": "uuid"}
```

### Main ↔ Renderer Communication (electron-trpc)

Use `electron-trpc` for end-to-end type-safe IPC instead of hand-written `ipcMain.handle` / `ipcRenderer.invoke`:

- Main process defines tRPC router with typed procedures
- Renderer calls procedures via tRPC client (auto-routed through ipcRenderer)
- Full TypeScript inference, zero runtime overhead

### State Management

Renderer uses Zustand (consistent with project's existing pattern in `src/state/store.ts`):

```typescript
interface ChatState {
  sessions: Session[];
  activeSessionId: string | null;
  messages: Message[];
  isStreaming: boolean;
  config: AppConfig;
  sendMessage: (content: string, attachments?: File[]) => void;
  abortStream: () => void;
  switchSession: (id: string) => void;
  updateConfig: (cfg: Partial<AppConfig>) => void;
}
```

### Config Persistence

`electron-store` with encrypted API key storage, data saved to user data directory:

```typescript
interface AppConfig {
  provider: 'anthropic' | 'openai' | 'gemini' | 'grok';
  apiKeys: Record<string, string>;
  model: string;
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  language: string;
  sendOnEnter: boolean;
}
```

## UI Layout

Three-column layout inspired by Claude Desktop / ChatGPT Desktop:

```
┌──────────────────────────────────────────────────┐
│  ◉ ◉ ◉   Claude Code Best              ― □ ×   │
├────────┬─────────────────────────┬───────────────┤
│        │                         │               │
│ 侧边栏  │      聊天主区域            │   Artifacts  │
│        │                         │    面板       │
│ 会话列表 │  Assistant 消息          │  (可折叠)     │
│ + 新建  │  (Markdown 渲染)         │               │
│        │  代码块 + 复制按钮         │  代码预览     │
│ 搜索    │  工具调用卡片             │  SVG 渲染     │
│        │                         │  HTML 预览     │
│ 设置 ⚙  │  User 消息              │  React 组件   │
│        │                         │               │
├────────┼─────────────────────────┤               │
│        │ 📎  输入框...        ▶ │               │
│        │     [模型选择器]        │               │
└────────┴─────────────────────────┴───────────────┘
```

## Feature Modules

### 1. Chat
- Streaming output with incremental rendering
- Markdown rendering (headings, lists, tables, links)
- Code blocks with syntax highlighting (shiki) + one-click copy
- Thinking chain (folded display)
- Multi-turn context management
- Conversation history search

### 2. File/Image Upload
- Drag-drop, paste, button select
- Image preview thumbnails
- PDF parsing
- Multi-file upload
- File size limit warnings

### 3. Artifacts Panel
- Right-side collapsible panel
- Render types: React/SVG/HTML live preview (sandboxed iframe), code files, Mermaid charts, KaTeX math
- Actions: copy code, open in new window, download

### 4. Tool Call Visualization
- Card-style tool call display
- Collapsible details
- Tool types: file read/write, shell commands, search
- Execution status (running/success/failure)
- Terminal-style output rendering

### 5. Session Management
- Left sidebar session list
- Create/delete/rename sessions
- Auto-generated session titles
- Session search
- Session import/export (JSON)

### 6. Model & Provider Management
- Model selector (next to input box)
- Providers: Anthropic, OpenAI-compatible (Ollama/DeepSeek/vLLM), Gemini, Grok (xAI)
- API key configuration (encrypted storage)
- Custom API endpoints

### 7. Settings
- Appearance: theme (light/dark/system), font size, language
- Keyboard shortcuts
- Data management: export/clear session data
- About page

### 8. System Integration
- System tray (minimize to tray, quick actions)
- Global hotkey (bring window to front)
- Native menu bar
- Dock right-click menu (macOS)
- Auto-update (electron-updater)
- URL scheme registration (`claude-desktop://`)

## Design Specification

Follow `.impeccable.md` brand guidelines:

- Brand color: Claude Orange `#D77757`
- Accent: Claude Blue `#5769F7`
- Fonts: Poppins (UI), Lora (optional body), JetBrains Mono (code)
- Dark mode: warm dark surfaces (not cold blue-black)
- Generous whitespace, typography-centric layout
- shadcn/ui component pattern (Radix UI + CVA + clsx + tailwind-merge)
- CSS variables in oklch color space (from RCS Web UI theme system)

## Tech Stack

### Core Dependencies

| Category | Library | Version | Purpose |
|----------|---------|---------|---------|
| Desktop | electron | ^34 | Main + renderer process |
| Build | electron-builder | ^26 | Multi-platform packaging |
| Update | electron-updater | ^6 | Auto-update |
| Config | electron-store | ^10 | Encrypted persistent config |
| Frontend | react / react-dom | ^19 | UI rendering |
| Build tool | electron-vite | latest | Unified main/preload/renderer build |
| Style | tailwindcss | ^4 | CSS framework |
| Components | @radix-ui/* | latest | Headless component base |
| Styling utils | CVA + clsx + tailwind-merge | latest | shadcn toolchain |
| Icons | lucide-react | latest | Icon library |
| Code highlight | shiki | latest | Syntax highlighting |
| Markdown | streamdown | latest | Streaming markdown rendering |
| Math | katex | latest | Math formula rendering |
| Charts | mermaid | latest | Chart rendering |
| State | zustand | ^5 | Client state |
| Animation | motion | ^12 | UI animation |
| Auto-scroll | use-stick-to-bottom | latest | Chat auto-scroll |
| Command palette | cmdk | latest | Quick command palette |
| File drop | react-dropzone | latest | File upload zone |
| IPC | electron-trpc | latest | Type-safe IPC |

### Dev Dependencies

| Category | Library | Purpose |
|----------|---------|---------|
| Types | typescript ^5 | Strict mode |
| Lint | biome | Consistent with main project |
| Test | vitest | Unit tests |
| E2E | playwright | Desktop E2E tests |

## Build & Distribution

### Build Flow

```bash
bun run build          # Build CLI first (main project)
cd packages/desktop
bun run build          # electron-vite build main + preload + renderer
bun run package        # electron-builder package
```

### electron-builder Config

```yaml
appId: com.claude-code-best.desktop
productName: Claude Code Best

directories:
  output: release
  buildResources: resources

extraResources:
  - from: "../../dist"        # CLI build output
    to: "cli"
    filter:
      - "**/*"

mac:
  category: public.app-category.productivity
  target: [dmg, zip]
  hardenedRuntime: true

win:
  target: [nsis, portable]

linux:
  target: [AppImage, deb]
  category: Office
```

CLI build artifacts are bundled as `extraResources` so the desktop app is self-contained.

### Error Handling

| Scenario | Handling |
|----------|----------|
| CLI subprocess crash | Auto-restart, preserve session state, notify user |
| Invalid/expired API key | Intercept 401, open settings panel |
| Network disconnect | Stream interruption notice, retry support |
| File upload too large | Frontend + backend validation, friendly error |
| Artifacts render failure | Degrade to raw code display |
| Missing Bun runtime | Bundle Bun binary (macOS/Linux), use Node.js-compatible build (Windows) |

### Testing Strategy

- **Unit tests** (vitest): Zustand stores, IPC handlers, utility functions
- **Component tests** (vitest + jsdom): React component rendering logic
- **E2E tests** (Playwright): Critical user flows (send message, switch model, upload file)
- **Manual tests**: Artifacts rendering, native menus, system tray, auto-update

## Integration with Main Project

```
根 package.json workspaces → packages/* (includes packages/desktop automatically)

packages/desktop/package.json:
  - Does NOT import CLI source modules
  - CLI invoked via subprocess + JSON Lines protocol
  - Shares @anthropic-ai/sdk version with main project
  - Reuses RCS Web UI's shadcn/ui component pattern
```

**Key principle**: Desktop app never imports CLI source code. All communication goes through subprocess + JSON Lines. This keeps CLI independently updatable and avoids Bun-specific API porting.
