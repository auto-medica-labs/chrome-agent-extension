# PRD: AI Browser Extension — Phase 1: Configurable Chat Foundation

## Problem statement
The project currently relies on a CLI interface that is only accessible to power users. Non-technical everyday users need a simple, browser-native way to chat with AI using their own API keys. This Phase 1 lays the architectural groundwork so a future agentic loop can perform browser operations without rewriting the core.

## Goals
- Ship a Chrome side-panel extension where users can configure any OpenAI-compatible API endpoint and hold a stateless, streamed chat.
- Build an architecture that cleanly supports future phases (persistence, tool-calling, DOM context) without rewrites.

## Non-goals
- Persistent chat history, conversation storage, or multi-threading.
- Tool-calling, agentic loop, or browser tab/DOM manipulation.
- Multi-user accounts, auth, or cloud sync.
- Support for non-OpenAI-compatible API formats.
- Mobile browser support (Firefox, Safari, Chrome Android/iOS).
- Voice input/output or file uploads.

## Users
- **Primary**: Non-technical everyday web users already familiar with ChatGPT-like UIs. They need zero-config defaults and a simple chat interface.
- **Secondary**: Developers who may extend the project into the agentic Phase 2. They need clean, component-based architecture and clear extension points.

## User stories
| ID | As a… | I want to… | So that… | Priority |
|----|-------|------------|----------|----------|
| US-01 | everyday user | configure my API key and endpoint in a settings panel | I can start chatting with AI in my browser | Must |
| US-02 | everyday user | save and switch between multiple provider/model profiles | I can quickly change which AI I'm talking to | Must |
| US-03 | everyday user | see streamed tokens appear as they arrive | I don't wait for the full response | Must |
| US-04 | everyday user | clear the current conversation and start over | I can reset context within a session | Must |
| US-05 | everyday user | see clear, non-technical error messages when something goes wrong | I know how to fix my setup | Should |
| US-06 | developer extending the project | find a clean component and state architecture | I can add agentic tool-calling later without rewriting | Must |

## Functional requirements
### Settings & Configuration
- FR-01 — Users can input and save API base URL, model name, and API key.
- FR-02 — Users can save multiple provider/model profiles and switch between them.
- FR-03 — A "Test connection" button validates the endpoint with a lightweight request before saving.
- FR-04 — Default provider preset is OpenAI (user must insert their own key).

### Chat
- FR-05 — Users can type a message and send it to the configured endpoint.
- FR-06 — Responses are streamed in real-time and rendered in a ChatGPT-like message list.
- FR-07 — Users can clear/reset the current conversation within the session.
- FR-08 — Users can abort an in-flight streaming request.
- FR-09 — Empty or whitespace-only messages are prevented from sending.

### UI & Interaction
- FR-10 — The primary interface lives in Chrome's side panel (not a popup).
- FR-11 — Settings panel is accessible from the side panel without losing current chat context.
- FR-12 — On first open with no valid config, an empty state prompts the user to configure.

### Error Handling
- FR-13 — Invalid or unreachable endpoint surfaces a clear "Could not reach the API" message.
- FR-14 — Invalid API key / auth failure surfaces an "Invalid API key" message.
- FR-15 — Streaming interruption leaves the partial response visible and allows retry.
- FR-16 — Rate limiting (HTTP 429) or server errors (5xx) are caught and suggest retrying later.

## Non-functional requirements
| Category | Requirement |
|----------|-------------|
| Security | API keys stored via `chrome.storage.local` (OS-encrypted at rest). All API calls use HTTPS. No server-side component, telemetry, or intermediary. |
| Platform | Chrome desktop (Windows, macOS, Linux) and Chrome-based browsers (Edge, Brave, Arc). Requires Chrome 114+ for `chrome.sidePanel` API. English UI only for Phase 1. |
| Privacy | Direct client-to-API calls from the browser. No conversation data persists locally in Phase 1. |
| Performance | No strict quantitative targets for Phase 1. Focus on functional correctness. Bundle size should remain reasonable for Web Store distribution. |
| Extensibility | State management chosen must support global injection of tool state and DOM context in Phase 2 without prop-drilling rewrites. |

## Dependencies & risks
| Item | Type | Owner | Risk |
|------|------|-------|------|
| Chrome `sidePanel` API availability | External / Platform | Dev | Med |
| AI SDK React hooks in extension isolated context | External / Library | Dev | Med |
| CORS/fetch to arbitrary user endpoints (incl. localhost) | External / Platform | Dev | Med |
| shadcn/ui + AI Elements bundling in Vite extension build | External / Tooling | Dev | Low |
| User-supplied OpenAI-compatible endpoint | External / User | User | Low |

## Success metrics
| Metric | Baseline | Target | Method |
|--------|----------|--------|--------|
| Functional chat | No extension exists; CLI only | Install extension, configure any OpenAI-compatible endpoint, send message, receive streamed response in side panel | Manual QA checklist |
| Extensibility | No codebase | Architecture review shows clear extension points for persistence, tool-calling, and DOM context | Code review / ADR |
| Developer onboarding | No documentation | New developer clones repo, runs `bun install`, builds and loads extension in Chrome in <5 minutes | README + AGENTS.md validation |

## Open questions
| # | Question | Owner |
|---|----------|-------|
| 1 | Validate `chrome.sidePanel` API behavior and lifecycle across Chrome 114+ and major Chromium forks. | Dev |
| 2 | Validate AI SDK `useChat` streaming works without SSR/routing assumptions inside the extension's isolated side-panel document. | Dev |
| 3 | Validate `fetch` to self-hosted `localhost` endpoints does not hit extension CSP or mixed-content issues. | Dev |
