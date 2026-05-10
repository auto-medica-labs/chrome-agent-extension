import { describe, it, expect, beforeEach } from "bun:test";
import {
  getProfiles,
  saveProfile,
  deleteProfile,
  getActiveProfileId,
  setActiveProfileId,
  getActiveProfile,
} from "../storage";

const store = new Map<string, unknown>();

(global as any).chrome = {
  storage: {
    local: {
      get: (
        keys: string | string[],
        cb: (result: Record<string, unknown>) => void,
      ) => {
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
      remove: (keys: string | string[], cb?: () => void) => {
        const keyList = Array.isArray(keys) ? keys : [keys];
        for (const key of keyList) {
          store.delete(key);
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
    const profile = {
      id: "1",
      name: "OpenAI",
      baseUrl: "https://api.openai.com",
      model: "gpt-4",
      apiKey: "sk-test",
    };
    await saveProfile(profile);
    const profiles = await getProfiles();
    expect(profiles).toEqual([profile]);
  });

  it("can delete a profile", async () => {
    const profile = {
      id: "1",
      name: "OpenAI",
      baseUrl: "https://api.openai.com",
      model: "gpt-4",
      apiKey: "sk-test",
    };
    await saveProfile(profile);
    await deleteProfile("1");
    const profiles = await getProfiles();
    expect(profiles).toEqual([]);
  });

  it("returns null when no active profile is set", async () => {
    expect(await getActiveProfileId()).toBeNull();
    expect(await getActiveProfile()).toBeNull();
  });

  it("can set and get active profile id", async () => {
    await setActiveProfileId("1");
    expect(await getActiveProfileId()).toBe("1");
  });

  it("getActiveProfile returns the active profile object", async () => {
    const profile = {
      id: "1",
      name: "OpenAI",
      baseUrl: "https://api.openai.com",
      model: "gpt-4",
      apiKey: "sk-test",
    };
    await saveProfile(profile);
    await setActiveProfileId("1");
    expect(await getActiveProfile()).toEqual(profile);
  });
});
