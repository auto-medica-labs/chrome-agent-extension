import { describe, it, expect, afterEach } from "bun:test";
import {
  render,
  fireEvent,
  cleanup,
  resetChromeStore,
} from "../__tests__/test-utils";
import userEvent from "@testing-library/user-event";
import { App } from "./App";

describe("App", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders empty state with settings CTA when no profile exists", async () => {
    const { findByText, findByRole } = render(<App />);
    expect(await findByText(/configure/i)).toBeDefined();
    expect(
      await findByRole("button", { name: /open settings/i }),
    ).toBeDefined();
  });

  it("opens settings panel without page reload when CTA is clicked", async () => {
    const { findByRole, queryByRole } = render(<App />);
    const settingsBtn = await findByRole("button", { name: /open settings/i });
    fireEvent.click(settingsBtn);
    expect(await findByRole("heading", { name: /settings/i })).toBeDefined();
    expect(queryByRole("button", { name: /open settings/i })).toBeNull();
    expect(await findByRole("button", { name: /back/i })).toBeDefined();
  });

  it("renders chat panel when an active profile exists", async () => {
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
    global.fetch = () =>
      Promise.resolve(
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(
                new TextEncoder().encode(
                  'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
                ),
              );
              controller.close();
            },
          }),
        ),
      );

    const user = userEvent.setup();
    const { findByRole, findByText } = render(<App />);

    expect(await findByText(/OpenAI/)).toBeDefined();

    const input = await findByRole("textbox");
    await user.type(input, "Hello AI");
    await user.click(await findByRole("button", { name: /send/i }));

    expect(await findByText("Hello AI")).toBeDefined();
    expect(await findByText("Hello")).toBeDefined();
  });
});
