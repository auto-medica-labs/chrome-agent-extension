import { describe, it, expect, afterEach } from "bun:test";
import {
  render,
  fireEvent,
  cleanup,
  resetChromeStore,
} from "../__tests__/test-utils";
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
});
