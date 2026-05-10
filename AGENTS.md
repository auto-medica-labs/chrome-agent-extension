# Architecture Guide — AI Browser Extension

## Overview

Chrome side-panel extension built with React (via Vite) on Bun. Single-page app rendered inside the side panel document. No background server — all API calls are direct client-to-provider fetch requests.

```
┌─────────────────────────────────────────────────┐
│  Chrome Side Panel                              │
│  ┌─────────────────────────────────────────┐    │
│  │  sidepanel.html                         │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │  App (state root)               │    │    │
│  │  │  ├── SettingsPanel              │    │    │
│  │  │  └── ChatPanel                  │    │    │
│  │  │       ├── chat.ts (streaming)   │    │    │
│  │  │       └── connection.ts (test)  │    │    │
│  │  └─────────────────────────────────┘    │    │
│  └─────────────────────────────────────────┘    │
│                   │                             │
│          chrome.storage.local                   │
│          (profiles, activeProfileId)            │
└─────────────────────────────────────────────────┘
```

## File map

| File | Responsibility |
|------|---------------|
| `src/sidepanel.tsx` | React entry point; mounts `<App />` into `#root` |
| `src/components/App.tsx` | Root component; owns profiles & routing state |
| `src/components/ChatPanel.tsx` | Message list, input bar, streamed response rendering |
| `src/components/SettingsPanel.tsx` | Profile CRUD, test connection, active profile selection |
| `src/storage.ts` | `chrome.storage.local` wrapper for profiles & active ID |
| `src/chat.ts` | SSE stream parser, `ChatError` typed error classes |
| `src/connection.ts` | Lightweight `/models` endpoint probe for "Test Connection" |
| `src/background.ts` | Service worker — configures `sidePanel` open-on-click behavior |
| `src/index.css` | All styles; vanilla CSS with CSS custom properties |
| `public/manifest.json` | Extension manifest (MV3) |
| `sidepanel.html` | HTML shell for the side panel document |
| `vite.config.ts` | Vite build config; multi-entry (sidepanel + background) |

## Component tree & state boundaries

```
<App>                              owns: profiles, activeProfile, showSettings, error
├── <SettingsPanel onBack={fn}>   owns: form fields, testResult (local)
│                                  reads/writes: chrome.storage.local (via storage.ts)
└── <ChatPanel profile={p}>       owns: messages, input, isLoading, error (local)
                                   reads: profile prop
                                   calls: streamChatCompletion() → fetch SSE
```

### State ownership

- **App-level state** (`App.tsx`): `profiles`, `activeProfile`, `showSettings`, global `error`. This is the minimal "routing" state — which view is showing and what profile is active.
- **Chat state** (`ChatPanel.tsx`): `messages[]`, `input`, `isLoading`, `error`. Fully local to the chat component. Cleared on unmount (per session).
- **Settings state** (`SettingsPanel.tsx`): form field values, `testResult`. Local to settings. On save/delete, syncs back to `chrome.storage.local`, and App re-fetches on return.
- **Persistent state** (`storage.ts`): Only `profiles[]` and `activeProfileId` survive across extension restarts. Stored in `chrome.storage.local` (OS-encrypted at rest on disk).

### Data flow

```
User types message
  → ChatPanel.handleSubmit()
    → streamChatCompletion(profile, messages, signal, onToken)
      → fetch POST /chat/completions (SSE)
        → onToken(token) callback
          → setMessages(prev => [...append token to last assistant message])
```

```
User saves profile
  → SettingsPanel.handleSave()
    → saveProfile(profile)          // writes chrome.storage.local
    → setActiveProfileId(id)        // if no active profile
  → onBack() callback
    → App re-fetches getProfiles(), getActiveProfile()
    → ChatPanel re-renders with new profile
```

## Phase 2 extension points

### 1. Conversation persistence

**Current**: Messages live in `ChatPanel`'s local `useState` and are lost on side panel close or profile switch.

**Phase 2 target**: Per-profile conversation history persisted across sessions.

**Where to plug in**:
- Add a `conversations` key to `chrome.storage.local` (or IndexedDB for larger payloads).
- After each message exchange, persist the updated `messages[]` array.
- On mount, `ChatPanel` reads the saved conversation for the active profile.
- This is additive — no component tree changes needed.

### 2. Tool-calling / agentic loop

**Current**: Stateless chat — user message in, assistant message out. No tools, no multi-step reasoning.

**Phase 2 target**: The assistant can call tools (e.g., read page content, click elements, extract data) and feed results back into the conversation.

**Where to plug in**:
- A new **tool registry** module (e.g., `src/tools.ts`) that defines available tool schemas.
- A **tool-loop component** (e.g., `src/components/ToolLoop.tsx`) that wraps/intercepts the streaming flow:
  - Sends messages + tool definitions to the API
  - When the API returns a `tool_calls` response, executes the tool
  - Feeds the tool result back as a `tool` role message
  - Continues streaming until a final assistant response
- `ChatPanel.handleSubmit()` delegates to the tool-loop instead of calling `streamChatCompletion()` directly.
- **State implication**: Tool results and loop state need to cross component boundaries. The current prop-based approach (`ChatPanel` receives `profile` from `App`) is narrow. For Phase 2, introduce a **React Context** (or Zustand store) to provide tool state and DOM context globally.

### 3. DOM context injection

**Current**: No access to browser tab content.

**Phase 2 target**: The assistant can "see" the current page's DOM (or a subset) as context for tool decisions.

**Where to plug in**:
- A new **content script** (`src/content.ts`) that extracts DOM context from the active tab.
- A **DOM context provider** (React Context) that holds the current page's extracted content.
- The tool-loop reads DOM context from this provider and includes it in tool execution.
- **State implication**: DOM context is inherently global — multiple components may need it. A React Context at the `App` level is the natural home. This is additive on top of the current architecture.

### Migration path for state management

**Phase 1 approach**: Props from `App` → `ChatPanel`. Sufficient for a single active profile and stateless chat.

**Phase 2 recommendation**: Introduce a **React Context** (or lightweight Zustand store) at the `App` level:

```tsx
// Example Phase 2 pattern (not implemented yet)
<App>
  <ToolStateProvider>       // provides tool registry, pending tool calls
    <DomContextProvider>    // provides current tab DOM snapshot
      <SettingsPanel />
      <ChatPanel />         // consumes tool state + DOM context via hooks
      <ToolLoop />          // new component for multi-step reasoning
    </DomContextProvider>
  </ToolStateProvider>
</App>
```

This is fully additive — no existing components need to be rewritten. The props remain for simple data (`profile`), while Context handles cross-cutting concerns (tool state, DOM context).

## Build tooling

| Command | What it does |
|---------|-------------|
| `bun install` | Installs all dependencies |
| `bun run build` | Vite production build → `dist/` |
| `bun run dev` | Vite watch mode (rebuild on change) |
| `bun test` | Runs all tests with Bun's built-in test runner |

**Build outputs** in `dist/`:
- `manifest.json` — copied from `public/`
- `sidepanel.html` — entry HTML
- `sidepanel.js` — bundled React app
- `sidepanel.css` — extracted CSS
- `background.js` — service worker
- `icon.png` — copied from `public/`

Load `dist/` as an unpacked extension in `chrome://extensions`.

## Testing

Tests use Bun's built-in test runner with `happy-dom` for DOM simulation and `@testing-library/react` for component tests.

| Test file | Scope |
|-----------|-------|
| `src/__tests__/build.test.ts` | Validates `dist/` artifacts exist and manifest is valid |
| `src/__tests__/background.test.ts` | Service worker behavior |
| `src/__tests__/storage.test.ts` | chrome.storage.local read/write logic |
| `src/__tests__/chat.test.ts` | SSE streaming error handling |
| `src/__tests__/connection.test.ts` | Test connection endpoint logic |
| `src/components/App.test.tsx` | App routing — empty state, chat view |
| `src/components/App.settings.test.tsx` | Settings integration — save, switch, delete profiles |
| `src/components/App.storage.test.tsx` | App reads from chrome.storage.local |
| `src/components/ChatPanel.test.tsx` | Message send, stream, abort, clear |
| `src/components/ChatPanel.error.test.tsx` | Chat error states — unreachable, auth, rate limit, abort |
