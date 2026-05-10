import { describe, it, expect } from "bun:test";
import fs from "node:fs";
import path from "node:path";

describe("extension build artifacts", () => {
  const dist = path.resolve(import.meta.dir, "../../dist");

  it("produces a manifest.json", () => {
    const manifestPath = path.join(dist, "manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);
  });

  it("manifest is valid v3 with sidePanel permission", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(dist, "manifest.json"), "utf-8"));
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.permissions).toContain("sidePanel");
  });

  it("produces sidepanel.html", () => {
    const htmlPath = path.join(dist, "sidepanel.html");
    expect(fs.existsSync(htmlPath)).toBe(true);
  });
});
