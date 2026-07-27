import { describe, expect, it } from "vitest";

import {
  getGeminiErrorStatus,
  getGeminiRetryDelay,
  isTransientGeminiError,
} from "./gemini-retry";

describe("Gemini retry policy", () => {
  it("retries only transient 429 and 503 failures", () => {
    expect(isTransientGeminiError({ status: 429 })).toBe(true);
    expect(isTransientGeminiError({ status: 503 })).toBe(true);
    expect(
      isTransientGeminiError({ message: "RESOURCE_EXHAUSTED rate limit" }),
    ).toBe(true);
    expect(isTransientGeminiError({ status: 404 })).toBe(false);
    expect(isTransientGeminiError({ status: 400 })).toBe(false);
  });

  it("uses bounded exponential delays", () => {
    expect(getGeminiRetryDelay(0)).toBe(1_000);
    expect(getGeminiRetryDelay(1)).toBe(2_000);
    expect(getGeminiRetryDelay(2)).toBe(4_000);
    expect(getGeminiRetryDelay(9)).toBe(4_000);
  });

  it("extracts numeric API status safely", () => {
    expect(getGeminiErrorStatus({ status: 429 })).toBe(429);
    expect(getGeminiErrorStatus({ status: "429" })).toBeNull();
    expect(getGeminiErrorStatus(null)).toBeNull();
  });
});
