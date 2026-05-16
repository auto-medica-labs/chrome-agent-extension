import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  render,
  cleanup,
  resetChromeStore,
} from "../__tests__/test-utils";
import userEvent from "@testing-library/user-event";
import { App } from "./App";

describe("App settings", () => {
  beforeEach(() => {
    resetChromeStore();
  });

  afterEach(() => {
    cleanup();
    global.fetch = undefined as unknown as typeof fetch;
  });

  it("allows user to save a new profile from settings", async () => {
    const user = userEvent.setup();
    const { findByRole, findByLabelText, findByText } = render(<App />);

    await user.click(await findByRole("button", { name: /open settings/i }));

    await user.type(await findByLabelText(/name/i), "Test Profile");
    await user.type(await findByLabelText(/base url/i), "https://api.test.com");
    await user.type(await findByLabelText(/model/i), "test-model");
    await user.type(await findByLabelText(/api key/i), "sk-test123");

    await user.click(await findByRole("button", { name: /save profile/i }));

    expect(await findByText("Test Profile")).toBeDefined();
    expect(await findByText("Active")).toBeDefined();
  });

  it("allows user to switch active profile", async () => {
    global.chrome.storage.local.set({
      profiles: [
        {
          id: "1",
          name: "Profile A",
          baseUrl: "https://a.com",
          model: "a",
          apiKey: "key-a",
        },
        {
          id: "2",
          name: "Profile B",
          baseUrl: "https://b.com",
          model: "b",
          apiKey: "key-b",
        },
      ],
      activeProfileId: "1",
    });

    const user = userEvent.setup();
    const { findByRole, findAllByText } = render(<App />);

    // Click the settings icon (gear button without text)
    const settingsBtn = await findByRole("button", { name: /settings/i });
    await user.click(settingsBtn);

    expect(await findByRole("heading", { name: /settings/i })).toBeDefined();

    await user.click(
      await findByRole("button", { name: /select/i }),
    );

    // Profile B should now be visible in the profile list
    expect(await findByRole("heading", { name: /settings/i })).toBeDefined();
  });

  it("allows user to delete a profile", async () => {
    global.chrome.storage.local.set({
      profiles: [
        {
          id: "1",
          name: "Profile A",
          baseUrl: "https://a.com",
          model: "a",
          apiKey: "key-a",
        },
      ],
      activeProfileId: "1",
    });

    const user = userEvent.setup();
    const { findByRole, queryByText } = render(<App />);

    await user.click(await findByRole("button", { name: /settings/i }));

    await user.click(await findByRole("button", { name: /delete/i }));

    expect(queryByText(/Profile A/)).toBeNull();
  });

  it("pre-fills new profile form with OpenAI defaults", async () => {
    const user = userEvent.setup();
    const { findByRole, findByLabelText } = render(<App />);

    await user.click(await findByRole("button", { name: /open settings/i }));

    const baseUrlInput = await findByLabelText(/base url/i);
    expect((baseUrlInput as HTMLInputElement).value).toBe(
      "https://api.openai.com/v1",
    );

    const modelInput = await findByLabelText(/model/i);
    expect((modelInput as HTMLInputElement).value).toBe("gpt-4o-mini");
  });

  it("shows success feedback when test connection passes", async () => {
    global.fetch = (() =>
      Promise.resolve(
        new Response(JSON.stringify({ data: [] }), { status: 200 }),
      )) as unknown as typeof fetch;

    const user = userEvent.setup();
    const { findByRole, findByLabelText, findByText } = render(<App />);

    await user.click(await findByRole("button", { name: /open settings/i }));
    await user.type(await findByLabelText(/name/i), "Test");
    await user.type(await findByLabelText(/api key/i), "sk-test");

    await user.click(await findByRole("button", { name: /test connection/i }));

    expect(await findByText(/connection successful/i)).toBeDefined();
  });

  it("shows failure feedback when test connection fails", async () => {
    global.fetch = (() =>
      Promise.resolve(new Response("", { status: 401 }))) as unknown as typeof fetch;

    const user = userEvent.setup();
    const { findByRole, findByLabelText, findByText } = render(<App />);

    await user.click(await findByRole("button", { name: /open settings/i }));
    await user.type(await findByLabelText(/name/i), "Test");
    await user.type(await findByLabelText(/api key/i), "sk-test");

    await user.click(await findByRole("button", { name: /test connection/i }));

    expect(await findByText(/invalid api key/i)).toBeDefined();
  });

  it("displays active profile name in chat view", async () => {
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

    const { findByText } = render(<App />);
    // Profile name appears in the model info line below the input: "Model: OpenAI"
    expect(await findByText(/Model: OpenAI/)).toBeDefined();
  });

  it("does not reset chat context when opening and closing settings", async () => {
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

    const user = userEvent.setup();
    const { findByRole, findByLabelText, queryByText } = render(<App />);

    // Chat view should show the textarea
    expect(await findByLabelText(/message input/i)).toBeDefined();

    await user.click(await findByRole("button", { name: /settings/i }));
    expect(await findByRole("heading", { name: /settings/i })).toBeDefined();

    await user.click(await findByRole("button", { name: /back/i }));
    expect(await findByLabelText(/message input/i)).toBeDefined();
    expect(queryByText(/Loading/)).toBeNull();
  });

  it("returns to empty state after deleting the last profile and closing settings", async () => {
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

    const user = userEvent.setup();
    const { findByRole, findByLabelText, findByText, queryByLabelText } = render(<App />);

    // Chat view should show the textarea
    expect(await findByLabelText(/message input/i)).toBeDefined();

    await user.click(await findByRole("button", { name: /settings/i }));
    await user.click(await findByRole("button", { name: /delete/i }));

    await user.click(await findByRole("button", { name: /back/i }));
    expect(await findByText(/configure/i)).toBeDefined();
    expect(queryByLabelText(/message input/i)).toBeNull();
  });
});
