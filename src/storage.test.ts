import { describe, it, expect, beforeEach } from "bun:test";
import { getProfiles, saveProfile } from "./storage";

const store = new Map<string, unknown>();

// @ts-expect-error minimal chrome mock
global.chrome = {
  storage: {
    local: {
      get: (keys: string | string[], cb: (result: Record<string, unknown>) => void) => {
        const result: Record<string, unknown> = {};
        const keyList = Array.isArray(keys) ? keys : [keys];
        for (const key of keyList) {
          if (store.has(key)) result[key] = store.get(key);
        }
        cb(result);
      },
      set: (items: Record<string, unknown>, cb?: () => void) => {
        for (const [key, value] of Object.entries(items)) {
          store.set(key, value);
        }
        if (cb) cb();
      },
    },
  },
};

describe("storage", () => {
  beforeEach(() => {
    store.clear();
  });

  it("returns empty array when no profiles exist", async () => {
    const profiles = await getProfiles();
    expect(profiles).toEqual([]);
  });

  it("can save and retrieve a profile", async () => {
    const profile = { id: "1", name: "OpenAI", baseUrl: "https://api.openai.com", model: "gpt-4", apiKey: "sk-test" };
    await saveProfile(profile);
    const profiles = await getProfiles();
    expect(profiles).toEqual([profile]);
  });
});
