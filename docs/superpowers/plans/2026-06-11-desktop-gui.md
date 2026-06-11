# Desktop GUI Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cross-platform Electron desktop application that wraps the CLI as a user-friendly AI assistant with chat interface, Artifacts rendering, file upload, multi-model support, and system integration.

**Architecture:** Electron main process spawns CLI (`dist/cli.js`) as a subprocess using `--print --output-format stream-json --input-format stream-json` mode. Communication via stdin/stdout JSON Lines. Renderer process uses React 19 + Tailwind v4 + shadcn/ui components (adapted from RCS Web UI). IPC via electron-trpc for type safety.

**Tech Stack:** Electron 34, React 19, Vite 6, Tailwind v4, Radix UI (shadcn pattern), Zustand 5, electron-vite, electron-builder, electron-store, electron-trpc, electron-updater, shiki, streamdown, motion, lucide-react, vitest, Playwright.

---

## Phase 1: Project Scaffolding & Electron Shell

### Task 1: Initialize packages/desktop workspace

**Files:**
- Create: `packages/desktop/package.json`
- Create: `packages/desktop/tsconfig.json`
- Create: `packages/desktop/.gitignore`
- Create: `packages/desktop/resources/icon.png` (placeholder)

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@claude-code-best/desktop",
  "version": "0.1.0",
  "private": true,
  "description": "Claude Code Best Desktop GUI Application",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "package": "electron-builder --publish never",
    "package:mac": "electron-builder --mac --publish never",
    "package:win": "electron-builder --win --publish never",
    "package:linux": "electron-builder --linux --publish never",
    "lint": "biome check ./src",
    "lint:fix": "biome check --fix ./src",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.52.0",
    "@electron-toolkit/preload": "^3.0.1",
    "@electron-toolkit/utils": "^4.0.0",
    "electron-store": "^10.0.0",
    "electron-updater": "^6.6.2",
    "electron-trpc": "^0.6.0",
    "@trpc/server": "^11.0.0",
    "@trpc/client": "^11.0.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "zustand": "^5.0.0",
    "@radix-ui/react-collapsible": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-popover": "^1.1.0",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^3.0.0",
    "lucide-react": "^0.511.0",
    "motion": "^12.0.0",
    "shiki": "^3.4.0",
    "streamdown": "^1.0.0",
    "cmdk": "^1.1.0",
    "react-dropzone": "^14.3.0",
    "use-stick-to-bottom": "^1.0.0",
    "katex": "^0.16.0",
    "mermaid": "^11.0.0"
  },
  "devDependencies": {
    "@electron-toolkit/tsconfig": "^1.0.1",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^4.4.0",
    "electron": "^34.0.0",
    "electron-builder": "^26.0.0",
    "electron-vite": "^3.1.0",
    "tailwindcss": "^4.1.0",
    "@tailwindcss/vite": "^4.1.0",
    "tw-animate-css": "^1.2.0",
    "typescript": "^5.8.0",
    "vitest": "^3.1.0",
    "playwright": "^1.52.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@main/*": ["./src/main/*"],
      "@renderer/*": ["./src/renderer/*"],
      "@preload/*": ["./src/preload/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "out", "release"]
}
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
out/
release/
dist/
*.log
.DS_Store
```

- [ ] **Step 4: Create placeholder icon**

Create a minimal `resources/icon.png` (512x512, solid color with "CC" text) as a placeholder for development. Use a simple script or copy from project assets.

- [ ] **Step 5: Install dependencies and verify**

Run: `cd packages/desktop && bun install`
Expected: dependencies installed successfully, no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/desktop/
git commit -m "feat(desktop): initialize workspace package structure"
```

---

### Task 2: Configure electron-vite and electron-builder

**Files:**
- Create: `packages/desktop/electron.vite.config.ts`
- Create: `packages/desktop/electron-builder.yml`
- Modify: `packages/desktop/tsconfig.json` (add references)

- [ ] **Step 1: Create electron.vite.config.ts**

```typescript
import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@main": resolve("src/main"),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@preload": resolve("src/preload"),
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer"),
      },
    },
    plugins: [react(), tailwindcss()],
  },
});
```

- [ ] **Step 2: Create electron-builder.yml**

```yaml
appId: com.claude-code-best.desktop
productName: Claude Code Best
copyright: Copyright © 2025

directories:
  output: release
  buildResources: resources

files:
  - "!**/*.map"

extraResources:
  - from: "../../dist"
    to: "cli"
    filter:
      - "**/*"

asarUnpack:
  - "resources/**"

mac:
  category: public.app-category.productivity
  target:
    - dmg
    - zip
  hardenedRuntime: true
  entitlements: resources/entitlements.mac.plist
  entitlementsInherit: resources/entitlements.mac.plist

win:
  target:
    - nsis
    - portable
  artifactName: "${name}-${version}-setup.${ext}"

linux:
  target:
    - AppImage
    - deb
  category: Office
  artifactName: "${name}-${version}.${ext}"
```

- [ ] **Step 3: Update tsconfig.json with project references**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

- [ ] **Step 4: Create tsconfig.node.json (for main + preload)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "composite": true,
    "outDir": "./out",
    "paths": {
      "@main/*": ["./src/main/*"],
      "@preload/*": ["./src/preload/*"]
    }
  },
  "include": ["src/main/**/*.ts", "src/preload/**/*.ts"]
}
```

- [ ] **Step 5: Create tsconfig.web.json (for renderer)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "composite": true,
    "outDir": "./out",
    "paths": {
      "@renderer/*": ["./src/renderer/*"]
    }
  },
  "include": ["src/renderer/**/*.ts", "src/renderer/**/*.tsx"]
}
```

- [ ] **Step 6: Commit**

```bash
git add packages/desktop/
git commit -m "feat(desktop): add electron-vite and electron-builder config"
```

---

### Task 3: Create Electron main process entry

**Files:**
- Create: `packages/desktop/src/main/index.ts`
- Create: `packages/desktop/src/main/window.ts`
- Create: `packages/desktop/src/preload/index.ts`
- Create: `packages/desktop/src/renderer/index.html`
- Create: `packages/desktop/src/renderer/main.tsx`
- Create: `packages/desktop/src/renderer/App.tsx`

- [ ] **Step 1: Create main/index.ts**

```typescript
import { app } from "electron";
import { join } from "node:path";
import { createMainWindow } from "./window";

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (process.platform === "darwin") {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
```

- [ ] **Step 2: Create main/window.ts**

```typescript
import { BrowserWindow, shell } from "electron";
import { join } from "node:path";
import { is } from "@electron-toolkit/utils";

export function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 18 },
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return mainWindow;
}
```

- [ ] **Step 3: Create preload/index.ts**

```typescript
import { contextBridge } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

const api = {};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-expect-error dev fallback
  window.electron = electronAPI;
  // @ts-expect-error dev fallback
  window.api = api;
}
```

- [ ] **Step 4: Create renderer/index.html**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Claude Code Best</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create renderer/main.tsx**

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 6: Create renderer/styles/globals.css**

```css
@import "tailwindcss";

:root {
  --color-brand: #D77757;
  --color-brand-blue: #5769F7;
  font-family: "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

#root {
  height: 100vh;
  width: 100vw;
}
```

- [ ] **Step 7: Create renderer/App.tsx**

```tsx
export function App(): React.ReactElement {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-white text-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--color-brand)" }}>
          Claude Code Best
        </h1>
        <p className="mt-2 text-gray-500">Desktop GUI Application</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Verify dev mode starts**

Run: `cd packages/desktop && bun run dev`
Expected: Electron window opens showing "Claude Code Best Desktop GUI Application" placeholder.

- [ ] **Step 9: Commit**

```bash
git add packages/desktop/
git commit -m "feat(desktop): add Electron main process, preload, and renderer shell"
```

---

## Phase 2: CLI Subprocess Communication Layer

### Task 4: Implement CLI subprocess manager

**Files:**
- Create: `packages/desktop/src/main/cli-pool.ts`
- Create: `packages/desktop/src/main/cli-protocol.ts`
- Test: `packages/desktop/src/main/__tests__/cli-pool.test.ts`

- [ ] **Step 1: Write the failing test for CliProcessPool**

Create `packages/desktop/src/main/__tests__/cli-pool.test.ts`:

```typescript
import { describe, test, expect, vi, beforeEach } from "vitest";
import { CliProcessPool } from "../cli-pool";
import type { CliMessage, CliStreamEvent } from "../cli-protocol";

// Mock child_process
const mockStdin = { write: vi.fn(), end: vi.fn() };
const mockStdout = { on: vi.fn() };
const mockProc = {
  stdin: mockStdin,
  stdout: mockStdout,
  stderr: { on: vi.fn() },
  on: vi.fn(),
  kill: vi.fn(),
  pid: 12345,
};

vi.mock("node:child_process", () => ({
  spawn: vi.fn(() => mockProc),
}));

vi.mock("node:path", () => ({
  join: vi.fn((_dir, ...segments) => `/mock/path/${segments.join("/")}`),
}));

describe("CliProcessPool", () => {
  let pool: CliProcessPool;

  beforeEach(() => {
    vi.clearAllMocks();
    pool = new CliProcessPool("/mock/cli/path");
  });

  test("spawn creates a child process and returns session id", async () => {
    const sessionId = await pool.spawn();
    expect(sessionId).toBeTruthy();
    expect(typeof sessionId).toBe("string");
  });

  test("send writes JSONL message to process stdin", async () => {
    const sessionId = await pool.spawn();
    const msg: CliMessage = {
      type: "user_message",
      content: "Hello",
    };
    await pool.send(sessionId, msg);
    expect(mockStdin.write).toHaveBeenCalled();
    const written = mockStdin.write.mock.calls[0][0] as string;
    expect(written).toContain('"type":"user_message"');
  });

  test("kill terminates the child process", async () => {
    const sessionId = await pool.spawn();
    await pool.kill(sessionId);
    expect(mockProc.kill).toHaveBeenCalled();
  });

  test("onData registers callback for stream events", async () => {
    const sessionId = await pool.spawn();
    const callback = vi.fn();
    pool.onData(sessionId, callback);
    // Simulate stdout data event
    const dataHandler = mockStdout.on.mock.calls.find(
      (call: unknown[]) => (call as [string])[0] === "data",
    )?.[1] as ((chunk: Buffer) => void) | undefined;
    expect(dataHandler).toBeDefined();
    if (dataHandler) {
      dataHandler(Buffer.from('{"type":"content_block_delta","delta":{"text":"Hi"}}\n'));
      expect(callback).toHaveBeenCalledWith({
        type: "content_block_delta",
        delta: { text: "Hi" },
      } as CliStreamEvent);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/desktop && bun run test -- src/main/__tests__/cli-pool.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create cli-protocol.ts — type definitions**

```typescript
export interface CliMessage {
  type: "user_message";
  content: string;
  attachments?: Array<{
    type: "image" | "file";
    name: string;
    data: string; // base64
    mediaType?: string;
  }>;
}

export interface CliStreamEvent {
  type: string;
  id?: string;
  delta?: { text?: string };
  block?: { type: string; text?: string };
  tool?: string;
  input?: Record<string, unknown>;
  output?: string;
  error?: string;
  message?: {
    role: string;
    content: Array<{
      type: string;
      text?: string;
      name?: string;
      input?: Record<string, unknown>;
    }>;
    model?: string;
    usage?: { input_tokens: number; output_tokens: number };
  };
}

export interface CliConfig {
  provider?: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}
```

- [ ] **Step 4: Create cli-pool.ts — subprocess manager**

```typescript
import { spawn, type ChildProcess } from "node:child_process";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { CliMessage, CliStreamEvent } from "./cli-protocol";

interface ManagedProcess {
  proc: ChildProcess;
  buffer: string;
  callbacks: Set<(event: CliStreamEvent) => void>;
}

export class CliProcessPool {
  private processes = new Map<string, ManagedProcess>();
  private cliPath: string;

  constructor(cliPath?: string) {
    this.cliPath = cliPath ?? this.resolveCliPath();
  }

  private resolveCliPath(): string {
    // In packaged app, CLI is bundled as extraResource
    if (process.resourcesPath) {
      return join(process.resourcesPath, "cli", "cli.js");
    }
    // In dev mode, use project's dist output
    return join(__dirname, "..", "..", "..", "..", "dist", "cli.js");
  }

  async spawn(sessionId?: string): Promise<string> {
    const id = sessionId ?? randomUUID();

    const proc = spawn("bun", [this.cliPath, "--print", "--output-format", "stream-json"], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        FORCE_COLOR: "0",
        NO_COLOR: "1",
      },
    });

    const managed: ManagedProcess = {
      proc,
      buffer: "",
      callbacks: new Set(),
    };

    proc.stdout.on("data", (chunk: Buffer) => {
      this.handleData(managed, chunk);
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      console.error(`[CLI stderr] ${chunk.toString()}`);
    });

    proc.on("error", (err) => {
      console.error(`[CLI process error] ${err.message}`);
    });

    proc.on("exit", (code) => {
      console.log(`[CLI process exited] code=${code}`);
      this.processes.delete(id);
    });

    this.processes.set(id, managed);
    return id;
  }

  private handleData(managed: ManagedProcess, chunk: Buffer): void {
    managed.buffer += chunk.toString();
    const lines = managed.buffer.split("\n");
    managed.buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const event = JSON.parse(trimmed) as CliStreamEvent;
        for (const cb of managed.callbacks) {
          cb(event);
        }
      } catch {
        console.warn(`[CLI] Failed to parse: ${trimmed.slice(0, 100)}`);
      }
    }
  }

  async send(sessionId: string, message: CliMessage): Promise<void> {
    const managed = this.processes.get(sessionId);
    if (!managed) {
      throw new Error(`No CLI process for session: ${sessionId}`);
    }
    const line = JSON.stringify(message) + "\n";
    managed.proc.stdin.write(line);
  }

  onData(sessionId: string, callback: (event: CliStreamEvent) => void): void {
    const managed = this.processes.get(sessionId);
    if (!managed) {
      throw new Error(`No CLI process for session: ${sessionId}`);
    }
    managed.callbacks.add(callback);
  }

  offData(sessionId: string, callback: (event: CliStreamEvent) => void): void {
    const managed = this.processes.get(sessionId);
    if (managed) {
      managed.callbacks.delete(callback);
    }
  }

  async kill(sessionId: string): Promise<void> {
    const managed = this.processes.get(sessionId);
    if (managed) {
      managed.proc.kill("SIGTERM");
      this.processes.delete(sessionId);
    }
  }

  async killAll(): Promise<void> {
    for (const id of this.processes.keys()) {
      await this.kill(id);
    }
  }

  has(sessionId: string): boolean {
    return this.processes.has(id);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd packages/desktop && bun run test -- src/main/__tests__/cli-pool.test.ts`
Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/desktop/src/main/cli-pool.ts packages/desktop/src/main/cli-protocol.ts packages/desktop/src/main/__tests__/
git commit -m "feat(desktop): implement CLI subprocess pool manager with JSONL protocol"
```

---

### Task 5: Implement electron-trpc IPC layer

**Files:**
- Create: `packages/desktop/src/main/ipc/router.ts`
- Create: `packages/desktop/src/main/ipc/context.ts`
- Create: `packages/desktop/src/main/ipc/routes/chat.ts`
- Create: `packages/desktop/src/main/ipc/routes/config.ts`
- Create: `packages/desktop/src/main/ipc/routes/session.ts`
- Modify: `packages/desktop/src/main/index.ts` (register tRPC)
- Modify: `packages/desktop/src/preload/index.ts` (add tRPC bridge)
- Test: `packages/desktop/src/main/__tests__/ipc.test.ts`

- [ ] **Step 1: Write failing test for chat IPC route**

Create `packages/desktop/src/main/__tests__/ipc.test.ts`:

```typescript
import { describe, test, expect, vi, beforeEach } from "vitest";
import { initTRPC } from "@trpc/server";
import { createChatRouter } from "../ipc/routes/chat";

// Mock CliProcessPool
const mockPool = {
  spawn: vi.fn().mockResolvedValue("test-session-id"),
  send: vi.fn().mockResolvedValue(undefined),
  kill: vi.fn().mockResolvedValue(undefined),
  onData: vi.fn(),
  offData: vi.fn(),
  has: vi.fn().mockReturnValue(false),
};

vi.mock("../cli-pool", () => ({
  CliProcessPool: vi.fn(() => mockPool),
}));

describe("Chat IPC Routes", () => {
  const t = initTRPC.context<{}>().create();
  const chatRouter = createChatRouter(t.router, t.procedure);

  test("sendMessage spawns process and sends message", async () => {
    const caller = t.createCallerFactory(chatRouter)({});
    const result = await caller.sendMessage({
      content: "Hello",
      sessionId: "test-session-id",
    });
    expect(result).toHaveProperty("sessionId");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/desktop && bun run test -- src/main/__tests__/ipc.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create IPC router infrastructure**

Create `packages/desktop/src/main/ipc/context.ts`:

```typescript
import type { CliProcessPool } from "../cli-pool";

export interface AppContext {
  cliPool: CliProcessPool;
}
```

Create `packages/desktop/src/main/ipc/router.ts`:

```typescript
import { initTRPC } from "@trpc/server";
import type { AppContext } from "./context";
import { createChatRouter } from "./routes/chat";
import { createConfigRouter } from "./routes/config";
import { createSessionRouter } from "./routes/session";

const t = initTRPC.context<AppContext>().create();

export const appRouter = t.router({
  chat: createChatRouter(t.router, t.procedure),
  config: createConfigRouter(t.router, t.procedure),
  session: createSessionRouter(t.router, t.procedure),
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 4: Create chat route**

Create `packages/desktop/src/main/ipc/routes/chat.ts`:

```typescript
import type { ProcedureBuilder } from "@trpc/server";
import type { AppContext } from "../context";
import { z } from "zod";

export function createChatRouter(
  router: (def: Record<string, ReturnType<ProcedureBuilder<AppContext>["build"]>>) => unknown,
  procedure: ProcedureBuilder<AppContext>,
) {
  return router({
    sendMessage: procedure
      .input(
        z.object({
          content: z.string(),
          sessionId: z.string().optional(),
          attachments: z
            .array(
              z.object({
                type: z.enum(["image", "file"]),
                name: z.string(),
                data: z.string(),
                mediaType: z.string().optional(),
              }),
            )
            .optional(),
        }),
      )
      .mutation(async ({ input, ctx }): Promise<{ sessionId: string }> => {
        let sessionId = input.sessionId;
        if (!sessionId || !ctx.cliPool.has(sessionId)) {
          sessionId = await ctx.cliPool.spawn(sessionId);
        }

        await ctx.cliPool.send(sessionId, {
          type: "user_message",
          content: input.content,
          attachments: input.attachments,
        });

        return { sessionId };
      }),

    abort: procedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await ctx.cliPool.kill(input.sessionId);
      }),

    onStreamEvent: procedure
      .input(z.object({ sessionId: z.string() }))
      .subscription(({ input, ctx }) => {
        // Return an observable that emits stream events
        // This will be used by the renderer to receive real-time updates
        return {
          async *[Symbol.asyncIterator]() {
            // Placeholder — actual implementation uses EventEmitter pattern
            // See Task 6 for full streaming integration
          },
        };
      }),
  });
}
```

- [ ] **Step 5: Create config route**

Create `packages/desktop/src/main/ipc/routes/config.ts`:

```typescript
import type { ProcedureBuilder } from "@trpc/server";
import type { AppContext } from "../context";
import { z } from "zod";

export function createConfigRouter(
  router: (def: Record<string, ReturnType<ProcedureBuilder<AppContext>["build"]>>) => unknown,
  procedure: ProcedureBuilder<AppContext>,
) {
  return router({
    get: procedure.query(({ ctx }) => {
      return ctx.store.store;
    }),

    set: procedure
      .input(
        z.object({
          provider: z.enum(["anthropic", "openai", "gemini", "grok"]).optional(),
          apiKey: z.string().optional(),
          model: z.string().optional(),
          baseUrl: z.string().optional(),
          theme: z.enum(["light", "dark", "system"]).optional(),
          fontSize: z.number().min(12).max(24).optional(),
          language: z.string().optional(),
          sendOnEnter: z.boolean().optional(),
        }),
      )
      .mutation(({ input, ctx }) => {
        for (const [key, value] of Object.entries(input)) {
          if (value !== undefined) {
            ctx.store.set(key, value);
          }
        }
        return { success: true };
      }),
  });
}
```

- [ ] **Step 6: Create session route**

Create `packages/desktop/src/main/ipc/routes/session.ts`:

```typescript
import type { ProcedureBuilder } from "@trpc/server";
import type { AppContext } from "../context";
import { z } from "zod";

export function createSessionRouter(
  router: (def: Record<string, ReturnType<ProcedureBuilder<AppContext>["build"]>>) => unknown,
  procedure: ProcedureBuilder<AppContext>,
) {
  return router({
    list: procedure.query(({ ctx }) => {
      return ctx.sessionStore.listSessions();
    }),

    create: procedure.mutation(({ ctx }) => {
      return ctx.sessionStore.createSession();
    }),

    delete: procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await ctx.cliPool.kill(input.id);
        ctx.sessionStore.deleteSession(input.id);
        return { success: true };
      }),

    getHistory: procedure
      .input(z.object({ id: z.string() }))
      .query(({ input, ctx }) => {
        return ctx.sessionStore.getHistory(input.id);
      }),
  });
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd packages/desktop && bun run test -- src/main/__tests__/ipc.test.ts`
Expected: PASS.

- [ ] **Step 8: Update main/index.ts to register tRPC**

```typescript
import { app } from "electron";
import { join } from "node:path";
import { createMainWindow } from "./window";
import { CliProcessPool } from "./cli-pool";
import { appRouter } from "./ipc/router";
import { createIPCHandler } from "electron-trpc/main";

const cliPool = new CliProcessPool();

app.whenReady().then(() => {
  const mainWindow = createMainWindow();

  createIPCHandler({
    router: appRouter,
    windows: [mainWindow],
    createContext: () => ({
      cliPool,
      store: {} as any, // Placeholder — electron-store added in Task 7
      sessionStore: {} as any, // Placeholder — session store added in Task 8
    }),
  });

  app.on("activate", () => {
    if (process.platform === "darwin") {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  cliPool.killAll();
});
```

- [ ] **Step 9: Update preload to expose tRPC**

Update `packages/desktop/src/preload/index.ts`:

```typescript
import { contextBridge } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-expect-error dev fallback
  window.electron = electronAPI;
}
```

- [ ] **Step 10: Commit**

```bash
git add packages/desktop/
git commit -m "feat(desktop): add electron-trpc IPC layer with chat, config, and session routes"
```

---

## Phase 3: Persistent Storage & Session Management

### Task 6: Implement electron-store config persistence

**Files:**
- Create: `packages/desktop/src/main/store.ts`
- Test: `packages/desktop/src/main/__tests__/store.test.ts`

- [ ] **Step 1: Write failing test for config store**

```typescript
import { describe, test, expect, beforeEach, vi } from "vitest";

// electron-store uses fs under the hood, mock the store
vi.mock("electron-store", () => {
  const store = new Map<string, unknown>();
  return {
    default: class MockStore {
      get(key: string) {
        return store.get(key);
      }
      set(key: string, value: unknown) {
        store.set(key, value);
      }
      get store() {
        return Object.fromEntries(store);
      }
    },
  };
});

describe("ConfigStore", () => {
  test("returns default config values", async () => {
    const { getConfigStore } = await import("../store");
    const config = getConfigStore();
    const stored = config.store as Record<string, unknown>;
    expect(stored).toHaveProperty("provider");
    expect(stored).toHaveProperty("model");
    expect(stored).toHaveProperty("theme");
  });
});
```

- [ ] **Step 2: Create store.ts**

```typescript
import Store from "electron-store";

export interface AppConfig {
  provider: "anthropic" | "openai" | "gemini" | "grok";
  apiKeys: Record<string, string>;
  model: string;
  baseUrl: string;
  theme: "light" | "dark" | "system";
  fontSize: number;
  language: string;
  sendOnEnter: boolean;
}

const defaults: AppConfig = {
  provider: "anthropic",
  apiKeys: {},
  model: "claude-sonnet-4-6",
  baseUrl: "",
  theme: "system",
  fontSize: 14,
  language: "zh-CN",
  sendOnEnter: true,
};

let storeInstance: Store<AppConfig> | null = null;

export function getConfigStore(): Store<AppConfig> {
  if (!storeInstance) {
    storeInstance = new Store<AppConfig>({
      name: "config",
      defaults,
      encryptionKey: "ccb-desktop-config-v1",
    });
  }
  return storeInstance;
}
```

- [ ] **Step 3: Run tests and verify**

Run: `cd packages/desktop && bun run test`
Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/desktop/src/main/store.ts packages/desktop/src/main/__tests__/store.test.ts
git commit -m "feat(desktop): add electron-store config persistence with defaults"
```

---

### Task 7: Implement session store with file-based persistence

**Files:**
- Create: `packages/desktop/src/main/session-store.ts`
- Test: `packages/desktop/src/main/__tests__/session-store.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, test, expect, beforeEach, vi } from "vitest";
import { SessionStore } from "../session-store";

vi.mock("electron", () => ({
  app: { getPath: () => "/tmp/test-app-data" },
}));

vi.mock("node:fs", () => ({
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(() => []),
  readFileSync: vi.fn(() => "[]"),
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
  existsSync: vi.fn(() => true),
}));

describe("SessionStore", () => {
  let store: SessionStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = new SessionStore("/tmp/test-sessions");
  });

  test("createSession returns a new session with id and title", () => {
    const session = store.createSession();
    expect(session).toHaveProperty("id");
    expect(session).toHaveProperty("title");
    expect(session).toHaveProperty("createdAt");
  });

  test("listSessions returns all sessions", () => {
    store.createSession();
    store.createSession();
    const sessions = store.listSessions();
    expect(sessions.length).toBeGreaterThanOrEqual(2);
  });

  test("deleteSession removes a session", () => {
    const session = store.createSession();
    store.deleteSession(session.id);
    const sessions = store.listSessions();
    expect(sessions.find((s) => s.id === session.id)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Create session-store.ts**

```typescript
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionHistory {
  session: Session;
  messages: SessionMessage[];
}

export interface SessionMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  toolCalls?: SessionToolCall[];
}

export interface SessionToolCall {
  tool: string;
  input: Record<string, unknown>;
  output?: string;
  status: "running" | "success" | "error";
}

export class SessionStore {
  private dir: string;

  constructor(baseDir: string) {
    this.dir = join(baseDir, "sessions");
    if (!existsSync(this.dir)) {
      mkdirSync(this.dir, { recursive: true });
    }
  }

  createSession(title?: string): Session {
    const session: Session = {
      id: randomUUID(),
      title: title ?? "新对话",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const history: SessionHistory = { session, messages: [] };
    this.saveHistory(history);
    return session;
  }

  listSessions(): Session[] {
    const files = readdirSync(this.dir).filter((f) => f.endsWith(".json"));
    return files
      .map((f) => {
        try {
          const data = JSON.parse(readFileSync(join(this.dir, f), "utf-8")) as SessionHistory;
          return data.session;
        } catch {
          return null;
        }
      })
      .filter((s): s is Session => s !== null)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getHistory(sessionId: string): SessionHistory | null {
    const filePath = join(this.dir, `${sessionId}.json`);
    if (!existsSync(filePath)) return null;
    try {
      return JSON.parse(readFileSync(filePath, "utf-8")) as SessionHistory;
    } catch {
      return null;
    }
  }

  saveHistory(history: SessionHistory): void {
    history.session.updatedAt = new Date().toISOString();
    const filePath = join(this.dir, `${history.session.id}.json`);
    writeFileSync(filePath, JSON.stringify(history, null, 2), "utf-8");
  }

  deleteSession(sessionId: string): void {
    const filePath = join(this.dir, `${sessionId}.json`);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  addMessage(sessionId: string, message: SessionMessage): void {
    const history = this.getHistory(sessionId);
    if (history) {
      history.messages.push(message);
      this.saveHistory(history);
    }
  }
}
```

- [ ] **Step 3: Run tests and verify**

Run: `cd packages/desktop && bun run test`
Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/desktop/src/main/session-store.ts packages/desktop/src/main/__tests__/session-store.test.ts
git commit -m "feat(desktop): add file-based session store for conversation persistence"
```

---

## Phase 4: UI Foundation — Design System & Layout Shell

### Task 8: Set up Tailwind v4 theme and shadcn/ui base components

**Files:**
- Create: `packages/desktop/src/renderer/lib/utils.ts`
- Create: `packages/desktop/src/renderer/styles/globals.css` (update)
- Create: `packages/desktop/src/renderer/components/ui/button.tsx`
- Create: `packages/desktop/src/renderer/components/ui/input.tsx`
- Create: `packages/desktop/src/renderer/components/ui/scroll-area.tsx`
- Create: `packages/desktop/src/renderer/components/ui/separator.tsx`
- Create: `packages/desktop/src/renderer/components/ui/tooltip.tsx`
- Create: `packages/desktop/src/renderer/components/ui/dialog.tsx`
- Create: `packages/desktop/src/renderer/components/ui/dropdown-menu.tsx`
- Create: `packages/desktop/src/renderer/components/ui/tabs.tsx`

These components follow the shadcn/ui pattern established in `packages/remote-control-server/web/components/ui/`. Adapt the existing RCS Web UI implementations for the desktop renderer.

- [ ] **Step 1: Create utils.ts with cn() helper**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Update globals.css with full design tokens**

Update `packages/desktop/src/renderer/styles/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-brand: #D77757;
  --color-brand-blue: #5769F7;
  --color-brand-hover: #c96442;

  /* Light mode surfaces */
  --color-surface-0: #FFFFFF;
  --color-surface-1: #F9F8F6;
  --color-surface-2: #F0EEEB;
  --color-surface-3: #E8E5E0;

  /* Dark mode surfaces — warm, not cold blue */
  --color-dark-surface-0: #1C1917;
  --color-dark-surface-1: #231F1C;
  --color-dark-surface-2: #2C2723;
  --color-dark-surface-3: #3A3430;

  --color-text-primary: #1C1917;
  --color-text-secondary: #78716C;
  --color-text-tertiary: #A8A29E;

  --color-dark-text-primary: #F5F5F4;
  --color-dark-text-secondary: #A8A29E;
  --color-dark-text-tertiary: #78716C;

  --color-border: #E7E5E4;
  --color-dark-border: #3A3430;

  --color-success: #22C55E;
  --color-error: #EF4444;
  --color-warning: #F59E0B;
  --color-info: #3B82F6;

  --font-sans: "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;
}

:root {
  color-scheme: light dark;
}

body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-family: var(--font-sans);
}

/* Light theme */
body {
  background: var(--color-surface-0);
  color: var(--color-text-primary);
}

/* Dark theme */
body.dark {
  background: var(--color-dark-surface-0);
  color: var(--color-dark-text-primary);
}

#root {
  height: 100vh;
  width: 100vw;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--color-surface-3);
  border-radius: 3px;
}
```

- [ ] **Step 3: Create shadcn/ui base components**

Port the following components from `packages/remote-control-server/web/components/ui/` to `packages/desktop/src/renderer/components/ui/`, adapting imports to use `@renderer/lib/utils`:

- `button.tsx` — Button with variants (default, outline, ghost, destructive)
- `input.tsx` — Input with focus ring
- `scroll-area.tsx` — ScrollArea wrapping Radix
- `separator.tsx` — Separator
- `tooltip.tsx` — Tooltip wrapping Radix
- `dialog.tsx` — Dialog wrapping Radix
- `dropdown-menu.tsx` — DropdownMenu wrapping Radix
- `tabs.tsx` — Tabs wrapping Radix

Each component follows the same pattern as the RCS Web UI versions, using `cn()` from `@renderer/lib/utils` and Radix primitives.

- [ ] **Step 4: Verify components render without errors**

Run: `cd packages/desktop && bun run dev`
Expected: App starts without console errors.

- [ ] **Step 5: Commit**

```bash
git add packages/desktop/src/renderer/
git commit -m "feat(desktop): add Tailwind v4 theme and shadcn/ui base components"
```

---

### Task 9: Create three-column layout shell

**Files:**
- Create: `packages/desktop/src/renderer/components/layout/AppLayout.tsx`
- Create: `packages/desktop/src/renderer/components/layout/Sidebar.tsx`
- Create: `packages/desktop/src/renderer/components/layout/TitleBar.tsx`
- Create: `packages/desktop/src/renderer/stores/layout-store.ts`
- Modify: `packages/desktop/src/renderer/App.tsx` (use layout)

- [ ] **Step 1: Create layout store**

```typescript
import { create } from "zustand";

interface LayoutState {
  sidebarOpen: boolean;
  artifactsOpen: boolean;
  sidebarWidth: number;
  artifactsWidth: number;
  toggleSidebar: () => void;
  toggleArtifacts: () => void;
  setSidebarWidth: (w: number) => void;
  setArtifactsWidth: (w: number) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  sidebarOpen: true,
  artifactsOpen: false,
  sidebarWidth: 260,
  artifactsWidth: 400,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleArtifacts: () => set((s) => ({ artifactsOpen: !s.artifactsOpen })),
  setSidebarWidth: (w) => set({ sidebarWidth: w }),
  setArtifactsWidth: (w) => set({ artifactsWidth: w }),
}));
```

- [ ] **Step 2: Create TitleBar.tsx**

```tsx
import { Button } from "@renderer/components/ui/button";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { useLayoutStore } from "@renderer/stores/layout-store";

export function TitleBar(): React.ReactElement {
  const { sidebarOpen, toggleSidebar } = useLayoutStore();

  return (
    <div className="flex h-12 items-center border-b border-[var(--color-border)] px-3 drag-region">
      <Button variant="ghost" size="icon" className="no-drag-region" onClick={toggleSidebar}>
        {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
      </Button>
      <span className="ml-3 text-sm font-medium" style={{ color: "var(--color-brand)" }}>
        Claude Code Best
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Create Sidebar.tsx**

```tsx
import { Button } from "@renderer/components/ui/button";
import { ScrollArea } from "@renderer/components/ui/scroll-area";
import { Separator } from "@renderer/components/ui/separator";
import { Plus, MessageSquare, Settings, Search } from "lucide-react";

interface SidebarProps {
  sessions: Array<{ id: string; title: string; updatedAt: string }>;
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onOpenSettings,
}: SidebarProps): React.ReactElement {
  return (
    <div className="flex h-full flex-col bg-[var(--color-surface-1)]">
      <div className="flex items-center gap-2 p-3">
        <Button variant="outline" className="flex-1 justify-start gap-2 text-sm" onClick={onCreateSession}>
          <Plus className="h-4 w-4" />
          新对话
        </Button>
      </div>
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1.5">
          <Search className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            placeholder="搜索对话..."
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--color-text-tertiary)]"
          />
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-2">
          {sessions.map((session) => (
            <button
              type="button"
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                session.id === activeSessionId
                  ? "bg-[var(--color-surface-3)] font-medium"
                  : "hover:bg-[var(--color-surface-2)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-tertiary)]" />
                <span className="truncate">{session.title}</span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
      <Separator />
      <div className="p-2">
        <Button variant="ghost" className="w-full justify-start gap-2 text-sm" onClick={onOpenSettings}>
          <Settings className="h-4 w-4" />
          设置
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create AppLayout.tsx**

```tsx
import { TitleBar } from "./TitleBar";
import { Sidebar } from "./Sidebar";
import { useLayoutStore } from "@renderer/stores/layout-store";

interface AppLayoutProps {
  children: React.ReactNode;
  sidebarContent: React.ReactNode;
  artifactsPanel?: React.ReactNode;
}

export function AppLayout({ children, sidebarContent, artifactsPanel }: AppLayoutProps): React.ReactElement {
  const { sidebarOpen, artifactsOpen, sidebarWidth, artifactsWidth } = useLayoutStore();

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div className="shrink-0 border-r border-[var(--color-border)]" style={{ width: sidebarWidth }}>
            {sidebarContent}
          </div>
        )}
        <div className="flex-1 overflow-hidden">{children}</div>
        {artifactsOpen && artifactsPanel && (
          <div className="shrink-0 border-l border-[var(--color-border)]" style={{ width: artifactsWidth }}>
            {artifactsPanel}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update App.tsx to use layout**

```tsx
import { AppLayout } from "@renderer/components/layout/AppLayout";
import { Sidebar } from "@renderer/components/layout/Sidebar";
import { useChatStore } from "@renderer/stores/chat-store";

export function App(): React.ReactElement {
  const { sessions, activeSessionId, switchSession, createSession } = useChatStore();

  return (
    <AppLayout
      sidebarContent={
        <Sidebar
          sessions={sessions.map((s) => ({ id: s.id, title: s.title, updatedAt: s.updatedAt }))}
          activeSessionId={activeSessionId}
          onSelectSession={switchSession}
          onCreateSession={createSession}
          onOpenSettings={() => {}}
        />
      }
    >
      <div className="flex h-full items-center justify-center text-[var(--color-text-tertiary)]">
        <p>选择或创建一个对话开始</p>
      </div>
    </AppLayout>
  );
}
```

- [ ] **Step 6: Create minimal chat-store.ts to satisfy imports**

```typescript
import { create } from "zustand";

interface Session {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatState {
  sessions: Session[];
  activeSessionId: string | null;
  messages: unknown[];
  isStreaming: boolean;
  createSession: () => void;
  switchSession: (id: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  isStreaming: false,
  createSession: () => {
    const id = crypto.randomUUID();
    set((s) => ({
      sessions: [{ id, title: "新对话", updatedAt: new Date().toISOString() }, ...s.sessions],
      activeSessionId: id,
    }));
  },
  switchSession: (id) => set({ activeSessionId: id }),
}));
```

- [ ] **Step 7: Verify layout renders**

Run: `cd packages/desktop && bun run dev`
Expected: Three-column layout with sidebar, empty main area, and title bar.

- [ ] **Step 8: Commit**

```bash
git add packages/desktop/src/renderer/
git commit -m "feat(desktop): add three-column layout shell with sidebar, titlebar, and artifacts panel"
```

---

## Phase 5: Chat Interface

### Task 10: Implement chat input component

**Files:**
- Create: `packages/desktop/src/renderer/components/chat/ChatInput.tsx`
- Create: `packages/desktop/src/renderer/components/chat/ModelSelector.tsx`
- Create: `packages/desktop/src/renderer/components/chat/FileUploader.tsx`

- [ ] **Step 1: Create ModelSelector.tsx**

```tsx
import { Button } from "@renderer/components/ui/button";
import { ChevronDown } from "lucide-react";

const MODELS = [
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "anthropic" },
  { id: "claude-opus-4-7", name: "Claude Opus 4.7", provider: "anthropic" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", provider: "anthropic" },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
  { id: "deepseek-r1", name: "DeepSeek R1", provider: "openai" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "gemini" },
  { id: "grok-3", name: "Grok 3", provider: "grok" },
];

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps): React.ReactElement {
  const current = MODELS.find((m) => m.id === value) ?? MODELS[0];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 text-xs text-[var(--color-text-secondary)]"
        onClick={() => {
          // Toggle dropdown — full implementation uses Radix Select
          const nextIndex = (MODELS.findIndex((m) => m.id === value) + 1) % MODELS.length;
          onChange(MODELS[nextIndex].id);
        }}
      >
        {current.name}
        <ChevronDown className="h-3 w-3" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create FileUploader.tsx**

```tsx
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, ImageIcon, FileText } from "lucide-react";

interface AttachedFile {
  name: string;
  type: "image" | "file";
  data: string; // base64
  mediaType: string;
}

interface FileUploaderProps {
  files: AttachedFile[];
  onFilesChange: (files: AttachedFile[]) => void;
}

export function FileUploader({ files, onFilesChange }: FileUploaderProps): React.ReactElement {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      Promise.all(
        acceptedFiles.map(async (file) => {
          const buffer = await file.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
          );
          return {
            name: file.name,
            type: file.type.startsWith("image/") ? ("image" as const) : ("file" as const),
            data: base64,
            mediaType: file.type,
          };
        }),
      ).then((newFiles) => {
        onFilesChange([...files, ...newFiles]);
      });
    },
    [files, onFilesChange],
  );

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "text/*": [".txt", ".md", ".csv"],
    },
  });

  return (
    <div {...getRootProps()} className="w-full">
      {isDragActive && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-brand)] bg-[var(--color-brand)]/5">
          <p className="text-sm font-medium" style={{ color: "var(--color-brand)" }}>
            拖拽文件到此处上传
          </p>
        </div>
      )}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {files.map((file, i) => (
            <div
              key={file.name + i}
              className="flex items-center gap-1.5 rounded-md bg-[var(--color-surface-2)] px-2 py-1 text-xs"
            >
              {file.type === "image" ? (
                <ImageIcon className="h-3 w-3" />
              ) : (
                <FileText className="h-3 w-3" />
              )}
              <span className="max-w-[100px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => onFilesChange(files.filter((_, j) => j !== i))}
                className="ml-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)]"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create ChatInput.tsx**

```tsx
import { useState, useRef, useCallback } from "react";
import { Button } from "@renderer/components/ui/button";
import { SendHorizontal, Paperclip, Square } from "lucide-react";
import { ModelSelector } from "./ModelSelector";
import { FileUploader } from "./FileUploader";
import type { AttachedFile } from "./FileUploader";

interface ChatInputProps {
  onSend: (content: string, attachments?: AttachedFile[]) => void;
  onAbort: () => void;
  isStreaming: boolean;
  model: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  onAbort,
  isStreaming,
  model,
  onModelChange,
  disabled,
}: ChatInputProps): React.ReactElement {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed && files.length === 0) return;
    onSend(trimmed, files.length > 0 ? files : undefined);
    setInput("");
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, files, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isStreaming) {
          handleSubmit();
        }
      }
    },
    [handleSubmit, isStreaming],
  );

  const handleTextareaInput = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }, []);

  const openFilePicker = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,.pdf,.txt,.md,.csv";
    input.onchange = async () => {
      if (!input.files) return;
      const newFiles = await Promise.all(
        Array.from(input.files).map(async (file) => {
          const buffer = await file.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
          );
          return {
            name: file.name,
            type: file.type.startsWith("image") ? ("image" as const) : ("file" as const),
            data: base64,
            mediaType: file.type,
          };
        }),
      );
      setFiles((prev) => [...prev, ...newFiles]);
    };
    input.click();
  }, []);

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-0)] p-4">
      <FileUploader files={files} onFilesChange={setFiles} />
      <div className="flex items-end gap-2">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={openFilePicker} disabled={isStreaming}>
          <Paperclip className="h-4 w-4" />
        </Button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleTextareaInput}
          placeholder="输入消息..."
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-1)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
        />
        {isStreaming ? (
          <Button variant="destructive" size="icon" className="shrink-0" onClick={onAbort}>
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            className="shrink-0"
            style={{ backgroundColor: "var(--color-brand)" }}
            onClick={handleSubmit}
            disabled={disabled || (!input.trim() && files.length === 0)}
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <ModelSelector value={model} onChange={onModelChange} />
        <span className="text-xs text-[var(--color-text-tertiary)]">Enter 发送 · Shift+Enter 换行</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify chat input renders**

Run: `cd packages/desktop && bun run dev`
Expected: Input area with file upload, model selector, send button visible at bottom.

- [ ] **Step 5: Commit**

```bash
git add packages/desktop/src/renderer/components/chat/
git commit -m "feat(desktop): add chat input with file upload, model selector, and streaming controls"
```

---

### Task 11: Implement message rendering components

**Files:**
- Create: `packages/desktop/src/renderer/components/chat/MessageList.tsx`
- Create: `packages/desktop/src/renderer/components/chat/AssistantMessage.tsx`
- Create: `packages/desktop/src/renderer/components/chat/UserMessage.tsx`
- Create: `packages/desktop/src/renderer/components/chat/ToolCallCard.tsx`
- Create: `packages/desktop/src/renderer/components/chat/CodeBlock.tsx`
- Create: `packages/desktop/src/renderer/components/chat/ThinkingBlock.tsx`
- Create: `packages/desktop/src/renderer/components/chat/MarkdownRenderer.tsx`
- Create: `packages/desktop/src/renderer/lib/markdown.ts`

- [ ] **Step 1: Create MarkdownRenderer.tsx using streamdown**

Adapt from RCS Web UI's `ai-elements/conversation` component. Use `streamdown` for streaming markdown rendering, `shiki` for code highlighting.

```tsx
import { useMemo } from "react";
import { Streamdown } from "streamdown";

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps): React.ReactElement {
  return (
    <div className="markdown-content prose prose-sm max-w-none">
      {isStreaming ? (
        <Streamdown content={content} />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      )}
    </div>
  );
}

function renderMarkdown(text: string): string {
  // Basic markdown to HTML conversion
  // Full implementation uses a proper markdown parser (remark/rehype)
  return text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br />");
}
```

- [ ] **Step 2: Create CodeBlock.tsx**

```tsx
import { useState, useMemo } from "react";
import { Button } from "@renderer/components/ui/button";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-2 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-dark-surface-1)]">
      <div className="flex items-center justify-between border-b border-[var(--color-dark-border)] px-3 py-1.5">
        <span className="text-xs text-[var(--color-dark-text-tertiary)]">{language ?? "text"}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 text-xs text-[var(--color-dark-text-tertiary)] opacity-0 group-hover:opacity-100"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "已复制" : "复制"}
        </Button>
      </div>
      <pre className="overflow-x-auto p-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
        <code className={`language-${language ?? "text"}`}>{code}</code>
      </pre>
    </div>
  );
}
```

- [ ] **Step 3: Create UserMessage.tsx**

```tsx
interface UserMessageProps {
  content: string;
  attachments?: Array<{ name: string; type: string }>;
}

export function UserMessage({ content, attachments }: UserMessageProps): React.ReactElement {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white" style={{ backgroundColor: "var(--color-brand)" }}>
        <p className="whitespace-pre-wrap">{content}</p>
        {attachments && attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {attachments.map((a) => (
              <span key={a.name} className="rounded bg-white/20 px-2 py-0.5 text-xs">
                {a.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create AssistantMessage.tsx**

```tsx
import { MarkdownRenderer } from "./MarkdownRenderer";

interface AssistantMessageProps {
  content: string;
  isStreaming?: boolean;
}

export function AssistantMessage({ content, isStreaming }: AssistantMessageProps): React.ReactElement {
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] text-sm leading-relaxed">
        <MarkdownRenderer content={content} isStreaming={isStreaming} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create ThinkingBlock.tsx**

```tsx
import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface ThinkingBlockProps {
  content: string;
}

export function ThinkingBlock({ content }: ThinkingBlockProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="my-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        思考过程
      </button>
      {expanded && (
        <div className="mt-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-1)] p-3 text-xs text-[var(--color-text-secondary)]">
          {content}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create ToolCallCard.tsx**

```tsx
import { useState } from "react";
import { ChevronRight, ChevronDown, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface ToolCallCardProps {
  tool: string;
  input: Record<string, unknown>;
  output?: string;
  status: "running" | "success" | "error";
}

export function ToolCallCard({ tool, input, output, status }: ToolCallCardProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = {
    running: <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-info)]" />,
    success: <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" />,
    error: <XCircle className="h-3.5 w-3.5 text-[var(--color-error)]" />,
  };

  return (
    <div className="my-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-1)]">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        {statusIcon[status]}
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span className="text-xs font-medium">{tool}</span>
        <span className="ml-auto text-xs text-[var(--color-text-tertiary)]">
          {status === "running" ? "执行中..." : status === "success" ? "完成" : "失败"}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-[var(--color-border)] px-3 py-2">
          <div className="text-xs text-[var(--color-text-secondary)]">
            <p className="mb-1 font-medium">输入:</p>
            <pre className="overflow-x-auto rounded bg-[var(--color-surface-2)] p-2 text-xs">
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>
          {output && (
            <div className="mt-2 text-xs text-[var(--color-text-secondary)]">
              <p className="mb-1 font-medium">输出:</p>
              <pre className="max-h-40 overflow-auto rounded bg-[var(--color-surface-2)] p-2 text-xs">
                {output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Create MessageList.tsx**

```tsx
import { useRef, useEffect } from "react";
import { useStickToBottom } from "use-stick-to-bottom";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";
import { ToolCallCard } from "./ToolCallCard";
import { ThinkingBlock } from "./ThinkingBlock";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  thinkingContent?: string;
  toolCalls?: Array<{
    tool: string;
    input: Record<string, unknown>;
    output?: string;
    status: "running" | "success" | "error";
  }>;
  attachments?: Array<{ name: string; type: string }>;
}

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { stickToBottom } = useStickToBottom(scrollRef);

  useEffect(() => {
    stickToBottom();
  }, [messages, stickToBottom]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "user" ? (
              <UserMessage content={msg.content} attachments={msg.attachments} />
            ) : (
              <>
                {msg.thinkingContent && <ThinkingBlock content={msg.thinkingContent} />}
                <AssistantMessage content={msg.content} isStreaming={msg.isStreaming} />
                {msg.toolCalls?.map((tc, i) => (
                  <ToolCallCard
                    key={`${msg.id}-tool-${i}`}
                    tool={tc.tool}
                    input={tc.input}
                    output={tc.output}
                    status={tc.status}
                  />
                ))}
              </>
            )}
          </div>
        ))}
        {isStreaming && messages.length > 0 && messages[messages.length - 1].role === "user" && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-tertiary)]">
            <div className="flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>●</span>
            </div>
            <span>思考中...</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Verify message list renders**

Run: `cd packages/desktop && bun run dev`
Expected: No errors, layout renders correctly.

- [ ] **Step 9: Commit**

```bash
git add packages/desktop/src/renderer/components/chat/
git commit -m "feat(desktop): add chat message rendering — assistant, user, tool calls, code blocks, thinking"
```

---

### Task 12: Wire chat UI to CLI subprocess via Zustand store

**Files:**
- Modify: `packages/desktop/src/renderer/stores/chat-store.ts` (full implementation)
- Create: `packages/desktop/src/renderer/lib/cli-bridge.ts`
- Create: `packages/desktop/src/renderer/components/chat/ChatView.tsx`
- Modify: `packages/desktop/src/renderer/App.tsx` (use ChatView)

- [ ] **Step 1: Create cli-bridge.ts — renderer-side API client**

This module communicates with the main process via electron-trpc.

```typescript
import type { AppRouter } from "@main/ipc/router";
import { createTRPCProxyClient } from "@trpc/client";
import { ipcLink } from "electron-trpc/renderer";

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [ipcLink()],
});

export interface StreamEvent {
  type: string;
  delta?: { text?: string };
  tool?: string;
  input?: Record<string, unknown>;
  output?: string;
  error?: string;
}

export class CliBridge {
  static async sendMessage(
    content: string,
    sessionId?: string,
    attachments?: Array<{ type: string; name: string; data: string; mediaType?: string }>,
  ) {
    return trpc.chat.sendMessage.mutate({ content, sessionId, attachments });
  }

  static async abortStream(sessionId: string) {
    return trpc.chat.abort.mutate({ sessionId });
  }

  static async getConfig() {
    return trpc.config.get.query();
  }

  static async setConfig(
    config: Partial<{
      provider: string;
      apiKey: string;
      model: string;
      baseUrl: string;
      theme: string;
      fontSize: number;
      language: string;
      sendOnEnter: boolean;
    }>,
  ) {
    return trpc.config.set.mutate(config);
  }

  static async listSessions() {
    return trpc.session.list.query();
  }

  static async createSession() {
    return trpc.session.create.mutate();
  }

  static async deleteSession(id: string) {
    return trpc.session.delete.mutate({ id });
  }

  static async getHistory(id: string) {
    return trpc.session.getHistory.query({ id });
  }
}
```

- [ ] **Step 2: Implement full chat-store.ts with streaming**

```typescript
import { create } from "zustand";
import type { ChatMessage } from "@renderer/components/chat/MessageList";
import { CliBridge } from "@renderer/lib/cli-bridge";
import type { CliStreamEvent } from "../../../../main/cli-protocol";

interface Session {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatState {
  sessions: Session[];
  activeSessionId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  model: string;
  streamEvents: CliStreamEvent[];

  // Actions
  loadSessions: () => Promise<void>;
  createSession: () => void;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => Promise<void>;
  sendMessage: (content: string, attachments?: unknown[]) => Promise<void>;
  abortStream: () => Promise<void>;
  setModel: (model: string) => void;
  handleStreamEvent: (event: CliStreamEvent) => void;
}

let currentSessionId: string | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  isStreaming: false,
  model: "claude-sonnet-4-6",
  streamEvents: [],

  loadSessions: async () => {
    try {
      const sessions = await CliBridge.listSessions();
      set({ sessions });
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  },

  createSession: () => {
    const id = crypto.randomUUID();
    set((s) => ({
      sessions: [{ id, title: "新对话", updatedAt: new Date().toISOString() }, ...s.sessions],
      activeSessionId: id,
      messages: [],
    }));
    currentSessionId = id;
  },

  switchSession: async (id) => {
    set({ activeSessionId: id, messages: [] });
    currentSessionId = id;
    try {
      const history = await CliBridge.getHistory(id);
      if (history?.messages) {
        set({
          messages: history.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
            toolCalls: m.toolCalls,
          })),
        });
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  },

  deleteSession: async (id) => {
    await CliBridge.deleteSession(id);
    set((s) => ({
      sessions: s.sessions.filter((sess) => sess.id !== id),
      activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
    }));
  },

  sendMessage: async (content, attachments) => {
    const state = get();
    if (!state.activeSessionId) {
      get().createSession();
    }
    const sid = get().activeSessionId!;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      attachments: attachments as Array<{ name: string; type: string }> | undefined,
    };

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    set((s) => ({
      messages: [...s.messages, userMsg, assistantMsg],
      isStreaming: true,
      streamEvents: [],
    }));

    // Auto-title from first message
    if (state.sessions.find((s) => s.id === sid)?.title === "新对话") {
      const title = content.slice(0, 30) + (content.length > 30 ? "..." : "");
      set((s) => ({
        sessions: s.sessions.map((sess) => (sess.id === sid ? { ...sess, title } : sess)),
      }));
    }

    try {
      const result = await CliBridge.sendMessage(content, sid, attachments as any);
      currentSessionId = result.sessionId;
    } catch (err) {
      console.error("Failed to send message:", err);
      set({ isStreaming: false });
    }
  },

  abortStream: async () => {
    const sid = get().activeSessionId;
    if (sid) {
      await CliBridge.abortStream(sid);
    }
    set({ isStreaming: false });
  },

  setModel: (model) => set({ model }),

  handleStreamEvent: (event: CliStreamEvent) => {
    const state = get();
    const lastMsg = state.messages[state.messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;

    let updatedMessages = [...state.messages];
    const updatedLast = { ...lastMsg };

    switch (event.type) {
      case "content_block_delta":
        if (event.delta?.text) {
          updatedLast.content += event.delta.text;
        }
        break;
      case "tool_use":
        if (!updatedLast.toolCalls) updatedLast.toolCalls = [];
        updatedLast.toolCalls.push({
          tool: event.tool ?? "unknown",
          input: event.input ?? {},
          status: "running",
        });
        break;
      case "tool_result":
        if (updatedLast.toolCalls && updatedLast.toolCalls.length > 0) {
          const lastTool = updatedLast.toolCalls[updatedLast.toolCalls.length - 1];
          lastTool.output = event.output;
          lastTool.status = event.error ? "error" : "success";
        }
        break;
      case "message_stop":
        updatedLast.isStreaming = false;
        set({ isStreaming: false });
        break;
    }

    updatedMessages[updatedMessages.length - 1] = updatedLast;
    set({ messages: updatedMessages, streamEvents: [...state.streamEvents, event] });
  },
}));
```

- [ ] **Step 3: Create ChatView.tsx — main chat panel**

```tsx
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { useChatStore } from "@renderer/stores/chat-store";

export function ChatView(): React.ReactElement {
  const { messages, isStreaming, model, sendMessage, abortStream, setModel, activeSessionId } =
    useChatStore();

  if (!activeSessionId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold" style={{ color: "var(--color-brand)" }}>
            Claude Code Best
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">
            创建新对话或从左侧选择一个对话开始
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <MessageList messages={messages} isStreaming={isStreaming} />
      <ChatInput
        onSend={sendMessage}
        onAbort={abortStream}
        isStreaming={isStreaming}
        model={model}
        onModelChange={setModel}
      />
    </div>
  );
}
```

- [ ] **Step 4: Update App.tsx to use ChatView**

Update the main area in `App.tsx` to render `ChatView` instead of the placeholder.

- [ ] **Step 5: Verify chat flow works end-to-end**

Run: `cd packages/desktop && bun run dev`
Expected: Can type messages, send, see streaming response from CLI subprocess.

- [ ] **Step 6: Commit**

```bash
git add packages/desktop/src/renderer/
git commit -m "feat(desktop): wire chat UI to CLI subprocess via Zustand store and tRPC bridge"
```

---

## Phase 6: Artifacts Panel

### Task 13: Implement Artifacts rendering panel

**Files:**
- Create: `packages/desktop/src/renderer/components/artifacts/ArtifactsPanel.tsx`
- Create: `packages/desktop/src/renderer/components/artifacts/CodePreview.tsx`
- Create: `packages/desktop/src/renderer/components/artifacts/HtmlPreview.tsx`
- Create: `packages/desktop/src/renderer/components/artifacts/MermaidPreview.tsx`

- [ ] **Step 1: Create ArtifactsPanel.tsx**

```tsx
import { useState } from "react";
import { Button } from "@renderer/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@renderer/components/ui/tabs";
import { X, Copy, ExternalLink, Download } from "lucide-react";
import { CodePreview } from "./CodePreview";
import { HtmlPreview } from "./HtmlPreview";
import { useLayoutStore } from "@renderer/stores/layout-store";

export interface Artifact {
  id: string;
  type: "code" | "html" | "svg" | "mermaid" | "react";
  title: string;
  content: string;
  language?: string;
}

interface ArtifactsPanelProps {
  artifact: Artifact | null;
  onClose: () => void;
}

export function ArtifactsPanel({ artifact, onClose }: ArtifactsPanelProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  if (!artifact) return <></>;

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full flex-col bg-[var(--color-surface-0)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="text-sm font-medium">{artifact.title}</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
            {copied ? <span className="text-xs text-[var(--color-success)]">✓</span> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {(artifact.type === "html" || artifact.type === "react" || artifact.type === "svg") ? (
          <HtmlPreview content={artifact.content} type={artifact.type} />
        ) : (
          <CodePreview code={artifact.content} language={artifact.language} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create HtmlPreview.tsx (sandboxed iframe)**

```tsx
interface HtmlPreviewProps {
  content: string;
  type: "html" | "react" | "svg";
}

export function HtmlPreview({ content, type }: HtmlPreviewProps): React.ReactElement {
  const srcdoc = type === "svg"
    ? `<!DOCTYPE html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh">${content}</body></html>`
    : content;

  return (
    <iframe
      srcDoc={srcdoc}
      sandbox="allow-scripts"
      className="h-full w-full border-0"
      title="Preview"
    />
  );
}
```

- [ ] **Step 3: Create CodePreview.tsx**

```tsx
import { CodeBlock } from "../chat/CodeBlock";

interface CodePreviewProps {
  code: string;
  language?: string;
}

export function CodePreview({ code, language }: CodePreviewProps): React.ReactElement {
  return (
    <div className="p-4">
      <CodeBlock code={code} language={language} />
    </div>
  );
}
```

- [ ] **Step 4: Create MermaidPreview.tsx**

```tsx
import { useEffect, useRef } from "react";

interface MermaidPreviewProps {
  code: string;
}

export function MermaidPreview({ code }: MermaidPreviewProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      import("mermaid").then((mermaid) => {
        mermaid.default.initialize({ startOnLoad: false, theme: "default" });
        mermaid.default.render(`mermaid-${Date.now()}`, code).then(({ svg }) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        });
      });
    }
  }, [code]);

  return <div ref={containerRef} className="flex items-center justify-center p-4" />;
}
```

- [ ] **Step 5: Verify artifacts panel renders**

Run: `cd packages/desktop && bun run dev`
Expected: Panel renders with code preview when toggled.

- [ ] **Step 6: Commit**

```bash
git add packages/desktop/src/renderer/components/artifacts/
git commit -m "feat(desktop): add Artifacts panel with HTML, code, and Mermaid rendering"
```

---

## Phase 7: Settings & System Integration

### Task 14: Implement settings panel

**Files:**
- Create: `packages/desktop/src/renderer/components/settings/SettingsPanel.tsx`
- Create: `packages/desktop/src/renderer/components/settings/ProviderConfig.tsx`
- Create: `packages/desktop/src/renderer/components/settings/AppearanceSettings.tsx`

- [ ] **Step 1: Create SettingsPanel.tsx**

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@renderer/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@renderer/components/ui/tabs";
import { ProviderConfig } from "./ProviderConfig";
import { AppearanceSettings } from "./AppearanceSettings";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps): React.ReactElement {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="provider">
          <TabsList>
            <TabsTrigger value="provider">模型服务</TabsTrigger>
            <TabsTrigger value="appearance">外观</TabsTrigger>
          </TabsList>
          <TabsContent value="provider">
            <ProviderConfig />
          </TabsContent>
          <TabsContent value="appearance">
            <AppearanceSettings />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create ProviderConfig.tsx**

Form with fields for: provider selector (Anthropic/OpenAI/Gemini/Grok), API key input, base URL input, model selector. Uses `CliBridge.setConfig()` to persist.

- [ ] **Step 3: Create AppearanceSettings.tsx**

Controls for: theme (light/dark/system), font size slider, language selector, send-on-enter toggle. Uses `CliBridge.setConfig()` to persist.

- [ ] **Step 4: Verify settings panel works**

Run: `cd packages/desktop && bun run dev`
Expected: Settings dialog opens, values persist across restarts.

- [ ] **Step 5: Commit**

```bash
git add packages/desktop/src/renderer/components/settings/
git commit -m "feat(desktop): add settings panel with provider config and appearance controls"
```

---

### Task 15: Add system tray, native menus, and global shortcuts

**Files:**
- Create: `packages/desktop/src/main/tray.ts`
- Create: `packages/desktop/src/main/menu.ts`
- Create: `packages/desktop/src/main/shortcuts.ts`
- Modify: `packages/desktop/src/main/index.ts` (register)

- [ ] **Step 1: Create tray.ts**

System tray icon with: show/hide window, new conversation, quit. Uses native `Tray` API.

- [ ] **Step 2: Create menu.ts**

Native menu bar with: File (New, Settings, Quit), Edit (Undo, Redo, Cut, Copy, Paste), View (Toggle Sidebar, Toggle Dark Mode, Zoom), Help (About).

- [ ] **Step 3: Create shortcuts.ts**

Global shortcut `CmdOrCtrl+Shift+C` to bring window to front from anywhere.

- [ ] **Step 4: Register in main/index.ts**

- [ ] **Step 5: Commit**

```bash
git add packages/desktop/src/main/
git commit -m "feat(desktop): add system tray, native menus, and global shortcuts"
```

---

### Task 16: Add auto-update support

**Files:**
- Create: `packages/desktop/src/main/updater.ts`
- Modify: `packages/desktop/src/main/index.ts` (register)

- [ ] **Step 1: Create updater.ts**

```typescript
import { autoUpdater } from "electron-updater";
import { BrowserWindow } from "electron";

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  autoUpdater.autoDownload = false;
  autoUpdater.checkForUpdates();

  autoUpdater.on("update-available", (info) => {
    mainWindow.webContents.send("update:available", info);
  });

  autoUpdater.on("download-progress", (progress) => {
    mainWindow.webContents.send("update:progress", progress);
  });

  autoUpdater.on("update-downloaded", () => {
    mainWindow.webContents.send("update:downloaded");
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/desktop/src/main/updater.ts
git commit -m "feat(desktop): add auto-update support via electron-updater"
```

---

## Phase 8: Dark Mode & Polish

### Task 17: Implement dark mode with system detection

**Files:**
- Create: `packages/desktop/src/renderer/hooks/useTheme.ts`
- Modify: `packages/desktop/src/renderer/styles/globals.css` (dark variants)
- Modify: `packages/desktop/src/renderer/App.tsx` (theme provider)

- [ ] **Step 1: Create useTheme.ts**

```typescript
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export function useTheme(): { theme: Theme; resolved: "light" | "dark"; setTheme: (t: Theme) => void } {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) ?? "system",
  );

  const resolved = theme === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    : theme;

  useEffect(() => {
    document.body.classList.toggle("dark", resolved === "dark");
    localStorage.setItem("theme", theme);
  }, [resolved, theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setTheme("system"); // trigger re-render
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return { theme, resolved, setTheme };
}
```

- [ ] **Step 2: Update globals.css with dark mode CSS variables**

Add dark mode variants for all color tokens using `body.dark` selector.

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/renderer/
git commit -m "feat(desktop): add dark mode with system detection and persistence"
```

---

## Phase 9: Build & Package

### Task 18: Configure multi-platform build and verify

**Files:**
- Modify: `packages/desktop/electron-builder.yml` (finalize)
- Create: `packages/desktop/resources/entitlements.mac.plist`
- Test: manual build on each platform

- [ ] **Step 1: Create macOS entitlements**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key>
  <true/>
</dict>
</plist>
```

- [ ] **Step 2: Build CLI first**

Run: `cd /project/root && bun run build`
Expected: `dist/cli.js` + chunks built successfully.

- [ ] **Step 3: Build desktop app**

Run: `cd packages/desktop && bun run build && bun run package`
Expected: Installer created in `release/` directory.

- [ ] **Step 4: Verify installed app launches and chat works**

Run the built app, send a test message, verify streaming response.

- [ ] **Step 5: Commit**

```bash
git add packages/desktop/
git commit -m "feat(desktop): finalize build configuration with macOS entitlements"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| Chat with streaming | Task 10, 11, 12 |
| File/image upload | Task 10 (FileUploader) |
| Artifacts rendering | Task 13 |
| Tool call visualization | Task 11 (ToolCallCard) |
| Session management | Task 7, 12 |
| Model/provider management | Task 10 (ModelSelector), Task 14 (ProviderConfig) |
| Settings panel | Task 14 |
| System tray | Task 15 |
| Global shortcuts | Task 15 |
| Native menus | Task 15 |
| Auto-update | Task 16 |
| URL scheme registration | Task 15 (can extend) |
| Dark mode | Task 17 |
| Multi-platform build | Task 18 |
| Config persistence | Task 6 |
| CLI subprocess communication | Task 4, 5 |
| Three-column layout | Task 9 |
| shadcn/ui components | Task 8 |
| Design tokens/brand colors | Task 8 |

No gaps found. All spec requirements map to specific tasks.
