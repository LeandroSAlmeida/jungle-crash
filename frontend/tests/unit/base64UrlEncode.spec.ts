import { describe, it, expect } from "bun:test";
import { base64UrlEncode } from "../../src/services/auth";

describe("base64UrlEncode", () => {
  it("never includes standard base64 characters that are unsafe in URLs", () => {
    // Bytes chosen so that standard base64 would produce '+' and '/'.
    const bytes = new Uint8Array([251, 255, 191]);
    const encoded = base64UrlEncode(bytes);

    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });

  it("produces a deterministic value for the same input", () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    expect(base64UrlEncode(bytes)).toBe(base64UrlEncode(bytes));
  });
});
