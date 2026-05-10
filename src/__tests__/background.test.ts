import { describe, it, expect, beforeEach } from "bun:test";

let panelBehavior: { openPanelOnActionClick: boolean } | null = null;

const chromeMock = {
  sidePanel: {
    setPanelBehavior: (behavior: { openPanelOnActionClick: boolean }) => {
      panelBehavior = behavior;
    },
  },
};

// Merge with existing chrome mock instead of overwriting
// @ts-expect-error global chrome assignment
(globalThis.chrome ??= {});
// @ts-expect-error global chrome assignment
Object.assign(globalThis.chrome, chromeMock);

describe("background script", () => {
  beforeEach(() => {
    panelBehavior = null;
  });

  it("sets panel behavior to open on action click", async () => {
    await import(`../background.ts?cache=${Date.now()}`);

    expect(panelBehavior).not.toBeNull();
    expect(panelBehavior!.openPanelOnActionClick).toBe(true);
  });
});
