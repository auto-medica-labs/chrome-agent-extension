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
      activeProfileId: "1",
    });
    const { findByLabelText, queryByText } = render(<App />);
    // ChatPanel renders a textarea with aria-label "Message input"
    expect(await findByLabelText(/message input/i)).toBeDefined();
    expect(queryByText(/configure/i)).toBeNull();
  });
});
