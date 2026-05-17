import { describe, it, expect } from "vitest";
import { timingSafeEqual } from "./timing-safe";

describe("Constant-Time Comparison Utility", () => {
  it("should return true for identical Uint8Arrays", () => {
    const a = new Uint8Array([1, 2, 3, 4, 5]);
    const b = new Uint8Array([1, 2, 3, 4, 5]);
    expect(timingSafeEqual(a, b)).toBe(true);
  });

  it("should return false for different Uint8Arrays of same length", () => {
    const a = new Uint8Array([1, 2, 3, 4, 5]);
    const b = new Uint8Array([1, 2, 3, 4, 6]);
    expect(timingSafeEqual(a, b)).toBe(false);
  });

  it("should return false for Uint8Arrays of different lengths", () => {
    const a = new Uint8Array([1, 2, 3, 4, 5]);
    const b = new Uint8Array([1, 2, 3, 4]);
    expect(timingSafeEqual(a, b)).toBe(false);
  });

  it("should return true for empty arrays", () => {
    const a = new Uint8Array([]);
    const b = new Uint8Array([]);
    expect(timingSafeEqual(a, b)).toBe(true);
  });
});
