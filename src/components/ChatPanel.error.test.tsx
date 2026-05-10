import { describe, it, expect, afterEach } from "bun:test";
import { render, cleanup, fireEvent } from "../__tests__/test-utils";
import userEvent from "@testing-library/user-event";
import { ChatPanel } from "./ChatPanel";

function createStreamResponse(chunks: string[]) {
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream);
}

const profile = {
  id: "1",
  name: "Test",
  baseUrl: "https://api.test.com",
  model: "test-model",
  apiKey: "sk-test",
};

const streamChunk = 'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n';

describe("ChatPanel error handling", () => {
  afterEach(() => {
    cleanup();
    global.fetch = undefined as unknown as typeof fetch;
  });

  it("shows inline error message when API is unreachable", async () => {
    global.fetch = () => Promise.reject(new TypeError("Failed to fetch"));

    const user = userEvent.setup();
    const { findByRole, findByText } = render(<ChatPanel profile={profile} />);

    const input = await findByRole("textbox");
    await user.type(input, "Hello");
    await user.click(await findByRole("button", { name: /send/i }));

    expect(await findByText(/could not reach/i)).toBeDefined();
    expect(await findByText(/retry/i)).toBeDefined();
  });

  it("shows inline error message when API key is invalid (401)", async () => {
    global.fetch = () =>
      Promise.resolve(new Response("", { status: 401 })) as any;

    const user = userEvent.setup();
    const { findByRole, findByText } = render(<ChatPanel profile={profile} />);

    const input = await findByRole("textbox");
    await user.type(input, "Hello");
    await user.click(await findByRole("button", { name: /send/i }));

    expect(await findByText(/invalid api key/i)).toBeDefined();
  });

  it("shows inline error message when rate limited (429)", async () => {
    global.fetch = () =>
      Promise.resolve(new Response("", { status: 429 })) as any;

    const user = userEvent.setup();
    const { findByRole, findByText } = render(<ChatPanel profile={profile} />);

    const input = await findByRole("textbox");
    await user.type(input, "Hello");
    await user.click(await findByRole("button", { name: /send/i }));

    expect(await findByText(/rate limited/i)).toBeDefined();
    expect(await findByText(/retry later/i)).toBeDefined();
  });

  it("shows inline error message when server error (5xx)", async () => {
    global.fetch = () =>
      Promise.resolve(new Response("", { status: 502 })) as any;

    const user = userEvent.setup();
    const { findByRole, findByText } = render(<ChatPanel profile={profile} />);

    const input = await findByRole("textbox");
    await user.type(input, "Hello");
    await user.click(await findByRole("button", { name: /send/i }));

    expect(await findByText(/server error/i)).toBeDefined();
    expect(await findByText(/retry later/i)).toBeDefined();
  });

  it("preserves partial assistant response after abort", async () => {
    let resolveStream: () => void;
    const streamStarted = new Promise<void>((resolve) => {
      resolveStream = resolve;
    });

    global.fetch = () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(streamChunk));
          resolveStream();
          // Never call close — simulate in-progress stream
        },
      });
      return Promise.resolve(new Response(stream)) as any;
    };

    const user = userEvent.setup();
    const { findByRole, findByText } = render(<ChatPanel profile={profile} />);

    const input = await findByRole("textbox");
    await user.type(input, "Hi");
    await user.click(await findByRole("button", { name: /send/i }));

    // Wait for the first chunk to arrive
    await (streamStarted as unknown as Promise<void>);

    // The partial "Hello" should be visible
    expect(await findByText("Hello")).toBeDefined();

    // Now abort
    await user.click(await findByRole("button", { name: /stop/i }));

    // Partial response "Hello" should still be visible after abort
    expect(await findByText("Hello")).toBeDefined();
  });

  it("preserves partial assistant response after network drop mid-stream", async () => {
    let rejectStream: (err: Error) => void;
    const chunkReceived = new Promise<void>(async (resolve) => {
      // We'll resolve after chunk is received
      setTimeout(resolve, 50);
    });

    global.fetch = () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(streamChunk));
          setTimeout(() => {
            controller.error(new TypeError("network failure"));
          }, 10);
        },
      });
      return Promise.resolve(new Response(stream)) as any;
    };

    const user = userEvent.setup();
    const { findByRole, findByText } = render(<ChatPanel profile={profile} />);

    const input = await findByRole("textbox");
    await user.type(input, "Hi");
    await user.click(await findByRole("button", { name: /send/i }));

    // Wait for chunk + error to be processed
    await new Promise((r) => setTimeout(r, 100));

    // Partial "Hello" should still be visible
    expect(await findByText("Hello")).toBeDefined();
    // Error message should also be shown
    expect(await findByText(/interrupted/i)).toBeDefined();
  });

  it("allows user to send a new message after an error occurs", async () => {
    let callCount = 0;
    global.fetch = () => {
      callCount++;
      if (callCount === 1) {
        // First call fails with 401
        return Promise.resolve(new Response("", { status: 401 })) as any;
      }
      // Second call succeeds
      return Promise.resolve(createStreamResponse([streamChunk])) as any;
    };

    const user = userEvent.setup();
    const { findByRole, findByText } = render(<ChatPanel profile={profile} />);

    // First message: fails
    const input = await findByRole("textbox");
    await user.type(input, "Fail");
    await user.click(await findByRole("button", { name: /send/i }));
    expect(await findByText(/invalid api key/i)).toBeDefined();

    // Second message: should succeed (state is recovered)
    await user.type(input, "Retry");
    await user.click(await findByRole("button", { name: /send/i }));
    expect(await findByText("Hello")).toBeDefined();
  });
});
