import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { render, cleanup, resetChromeStore } from "../__tests__/test-utils";
import { App } from "./App";

describe("App with storage", () => {
  beforeEach(() => {
    resetChromeStore();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows empty state when no profiles exist in storage", async () => {
    const { findByText, findByRole } = render(<App />);
    expect(await findByText(/configure/i)).toBeDefined();
    expect(
      await findByRole("button", { name: /open settings/i }),
    ).toBeDefined();
  });

  it("shows chat when a valid profile exists in storage", async () => {
    global.chrome.storage.local.set({
      profiles: [
        {
          id: "1",
          name: "OpenAI",
          baseUrl: "https://api.openai.com",
          model: "gpt-4",
          apiKey: "sk-test",
        },
      ],
    });
    const { findByText, queryByText } = render(<App />);
    expect(await findByText(/chat/i)).toBeDefined();
    expect(queryByText(/configure/i)).toBeNull();
  });
});
