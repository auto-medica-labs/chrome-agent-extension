# AI Browser Extension

Browser extension that lets you configure any OpenAI-compatible API endpoint and chat with AI directly in Chrome's side panel. Phase 1 delivers configurable, streamed chat. Phase 2 adds persistence, tool-calling, and DOM context.

## Prerequisites

- [Bun](https://bun.com) ≥ 1.1
- Chrome ≥ 114 (or Chromium-based: Edge, Brave, Arc)

## Quick start (< 5 min)

```bash
# 1. Clone the repository
git clone <repo-url>
cd agent-extension

# 2. Install dependencies
bun install

# 3. Build the extension
bun run build
```

### Load in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `dist/` folder from this project
5. The extension icon appears in your toolbar

### Start chatting

1. Click the extension icon — the side panel opens
2. Click **Open Settings** and add a profile:
   - **Name**: any label (e.g., "OpenAI")
   - **Base URL**: `https://api.openai.com/v1`
   - **Model**: `gpt-4o-mini`
   - **API Key**: your OpenAI API key (`sk-...`)
3. Click **Save Profile**, then go back to the chat view
4. Type a message and press Enter

## Development

```bash
# Watch mode (rebuilds on file changes)
bun run dev

# Run tests
bun test

# After changes, reload the extension:
# chrome://extensions → click refresh ↻ on the extension card
```

## Architecture

See [`AGENTS.md`](./AGENTS.md) for the full architecture guide — component boundaries, state management, data flow, and Phase 2 extension points.
