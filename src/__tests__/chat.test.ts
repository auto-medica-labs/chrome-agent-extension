import { describe, it, expect, afterEach } from "bun:test";
import { streamChatCompletion, ChatError } from "../chat";
import type { StreamProfile, ChatMessage } from "../chat";

const profile: StreamProfile = {
  baseUrl: "https://api.test.com",
  model: "test-model",
  apiKey: "sk-test",
};

const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];

describe("streamChatCompletion error handling", () => {
  afterEach(() => {
    global.fetch = undefined as unknown as typeof fetch;
  });

  it("throws ChatError with type 'unauthorized' on HTTP 401", async () => {
    global.fetch = () =>
      Promise.resolve(new Response("", { status: 401 })) as any;

    const onToken = () => {};
    let error: ChatError | null = null;
    try {
      await streamChatCompletion(
        profile,
        messages,
        new AbortController().signal,
        onToken,
      );
    } catch (e) {
      error = e as ChatError;
    }
    expect(error).not.toBeNull();
    expect(error!.type).toBe("unauthorized");
    expect(error!.message).toMatch(/invalid api key/i);
  });

  it("throws ChatError with type 'rate_limited' on HTTP 429", async () => {
    global.fetch = () =>
      Promise.resolve(new Response("", { status: 429 })) as any;

    const onToken = () => {};
    let error: ChatError | null = null;
    try {
      await streamChatCompletion(
        profile,
        messages,
        new AbortController().signal,
        onToken,
      );
    } catch (e) {
      error = e as ChatError;
    }
    expect(error).not.toBeNull();
    expect(error!.type).toBe("rate_limited");
    expect(error!.message).toMatch(/retry/i);
  });

  it("throws ChatError with type 'server_error' on HTTP 5xx", async () => {
    global.fetch = () =>
      Promise.resolve(new Response("", { status: 502 })) as any;

    const onToken = () => {};
    let error: ChatError | null = null;
    try {
      await streamChatCompletion(
        profile,
        messages,
        new AbortController().signal,
        onToken,
      );
    } catch (e) {
      error = e as ChatError;
    }
    expect(error).not.toBeNull();
    expect(error!.type).toBe("server_error");
    expect(error!.message).toMatch(/retry/i);
  });

  it("throws ChatError with type 'unreachable' on network failure", async () => {
    global.fetch = () => Promise.reject(new TypeError("Failed to fetch"));

    const onToken = () => {};
    let error: ChatError | null = null;
    try {
      await streamChatCompletion(
        profile,
        messages,
        new AbortController().signal,
        onToken,
      );
    } catch (e) {
      error = e as ChatError;
    }
    expect(error).not.toBeNull();
    expect(error!.type).toBe("unreachable");
    expect(error!.message).toMatch(/could not reach/i);
  });

  it("propagates AbortError for user-initiated abort", async () => {
    const controller = new AbortController();
    global.fetch = (_url, init) => {
      const signal = init?.signal as AbortSignal;
      // Abort after a tick so fetch is in-flight
      return new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
        setTimeout(() => controller.abort(), 10);
      });
    };

    const onToken = () => {};
    try {
      await streamChatCompletion(
        profile,
        messages,
        controller.signal,
        onToken,
      );
      expect(false).toBe(true); // should not reach
    } catch (e) {
      expect((e as DOMException).name).toBe("AbortError");
    }
  });
});
