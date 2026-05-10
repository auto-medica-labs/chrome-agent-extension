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

describe("ChatPanel", () => {
  afterEach(() => {
    cleanup();
    global.fetch = undefined as unknown as typeof fetch;
  });

  it("submits a user message and displays it in the chat", async () => {
    global.fetch = () => Promise.resolve(createStreamResponse([]) as Response);

    const user = userEvent.setup();
    const { findByRole, findByText } = render(<ChatPanel profile={profile} />);

    const input = await findByRole("textbox");
    await user.type(input, "Hello AI");
    await user.click(await findByRole("button", { name: /send/i }));

    expect(await findByText("Hello AI")).toBeDefined();
  });

  it("rejects empty or whitespace-only messages", async () => {
    global.fetch = () => Promise.resolve(createStreamResponse([]) as Response);

    const user = userEvent.setup();
    const { findByRole, queryByText } = render(<ChatPanel profile={profile} />);

    const input = await findByRole("textbox");
    await user.type(input, "   ");
    await user.click(await findByRole("button", { name: /send/i }));

    expect(queryByText("   ")).toBeNull();
  });

  it("renders assistant tokens incrementally during streaming", async () => {
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
      'data: [DONE]\n\n',
    ];
    global.fetch = () => Promise.resolve(createStreamResponse(chunks) as Response);

    const user = userEvent.setup();
    const { findByRole, findByText } = render(<ChatPanel profile={profile} />);

    const input = await findByRole("textbox");
    await user.type(input, "Hi");
    await user.click(await findByRole("button", { name: /send/i }));

    expect(await findByText("Hello world")).toBeDefined();
  });

  it("shows abort button during streaming and cancels the request when clicked", async () => {
    let abortCalled = false;
    global.fetch = (_url, init) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal as AbortSignal;
        signal.addEventListener("abort", () => {
          abortCalled = true;
          reject(new DOMException("Aborted", "AbortError"));
        });
        // Intentionally never resolve to simulate in-flight request
      });
    };

    const user = userEvent.setup();
    const { findByRole } = render(<ChatPanel profile={profile} />);

    const input = await findByRole("textbox");
    await user.type(input, "Hi");
    await user.click(await findByRole("button", { name: /send/i }));

    const abortBtn = await findByRole("button", { name: /stop/i });
    await user.click(abortBtn);

    expect(abortCalled).toBe(true);
  });

  it("clears conversation when clear button is clicked", async () => {
    global.fetch = () => Promise.resolve(createStreamResponse([]) as Response);

    const user = userEvent.setup();
    const { findByRole, queryByText } = render(<ChatPanel profile={profile} />);

    const input = await findByRole("textbox");
    await user.type(input, "Hello");
    await user.click(await findByRole("button", { name: /send/i }));

    expect(await queryByText("Hello")).toBeDefined();

    await user.click(await findByRole("button", { name: /clear/i }));
    expect(queryByText("Hello")).toBeNull();
  });

  it("disables input while a stream is in flight", async () => {
    global.fetch = () => new Promise(() => {}); // never resolves

    const user = userEvent.setup();
    const { findByRole } = render(<ChatPanel profile={profile} />);

    const input = await findByRole("textbox");
    await user.type(input, "Hi");
    await user.click(await findByRole("button", { name: /send/i }));

    const textbox = await findByRole("textbox");
    expect((textbox as HTMLInputElement).disabled).toBe(true);
  });
});
