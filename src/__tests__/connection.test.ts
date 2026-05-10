import { describe, it, expect, afterEach } from "bun:test";
import { testConnection } from "../connection";

const profile = {
  id: "test",
  name: "Test",
  baseUrl: "https://api.test.com",
  model: "test-model",
  apiKey: "sk-test",
};

describe("testConnection error handling", () => {
  afterEach(() => {
    global.fetch = undefined as unknown as typeof fetch;
  });

  it("returns success on HTTP 200", async () => {
    global.fetch = () =>
      Promise.resolve(
        new Response(JSON.stringify({ data: [] }), { status: 200 }),
      ) as any;

    const result = await testConnection(profile);
    expect(result.success).toBe(true);
    expect(result.message).toMatch(/connection successful/i);
  });

  it("returns 'Invalid API key' on HTTP 401", async () => {
    global.fetch = () =>
      Promise.resolve(new Response("", { status: 401 })) as any;

    const result = await testConnection(profile);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid api key/i);
  });

  it("returns rate-limited message on HTTP 429", async () => {
    global.fetch = () =>
      Promise.resolve(new Response("", { status: 429 })) as any;

    const result = await testConnection(profile);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/rate limited/i);
    expect(result.message).toMatch(/retry later/i);
  });

  it("returns server error message on HTTP 5xx", async () => {
    global.fetch = () =>
      Promise.resolve(new Response("", { status: 502 })) as any;

    const result = await testConnection(profile);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/server error/i);
    expect(result.message).toMatch(/retry later/i);
  });

  it("returns unreachable message on network failure", async () => {
    global.fetch = () => Promise.reject(new TypeError("Failed to fetch"));

    const result = await testConnection(profile);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/could not reach the api/i);
  });

  it("returns unreachable message for other HTTP errors", async () => {
    global.fetch = () =>
      Promise.resolve(new Response("", { status: 404 })) as any;

    const result = await testConnection(profile);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/could not reach the api/i);
  });
});
