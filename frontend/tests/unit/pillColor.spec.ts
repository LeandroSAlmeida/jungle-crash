import { describe, it, expect } from "bun:test";
import { pillColor } from "../../src/lib/pillColor";

describe("pillColor", () => {
  it("colors a low crash point red", () => {
    expect(pillColor(1.23).text).toBe("#FF4D6A");
  });

  it("colors a moderate crash point orange", () => {
    expect(pillColor(3.5).text).toBe("#FFB340");
  });

  it("colors a good crash point green", () => {
    expect(pillColor(7).text).toBe("#6DC532");
  });

  it("colors a high crash point cyan", () => {
    expect(pillColor(15).text).toBe("#00E5FF");
  });

  it("treats threshold boundaries as belonging to the next bracket", () => {
    expect(pillColor(2).text).toBe("#FFB340");
    expect(pillColor(5).text).toBe("#6DC532");
    expect(pillColor(10).text).toBe("#00E5FF");
  });
});
