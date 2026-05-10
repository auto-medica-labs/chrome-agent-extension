import { Window } from "happy-dom";

const win = new Window();
// @ts-expect-error assign to global
global.document = win.document;
// @ts-expect-error assign to global
global.window = win;
// @ts-expect-error assign to global
global.navigator = win.navigator;

const store = new Map<string, unknown>();
(global as any).chrome = {
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

export function resetChromeStore() {
  store.clear();
}

export { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
