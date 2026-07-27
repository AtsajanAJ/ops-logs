export function getGeminiErrorStatus(error: unknown): number | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }
  return null;
}

export function isTransientGeminiError(error: unknown): boolean {
  const status = getGeminiErrorStatus(error);
  if (status === 429 || status === 503) return true;

  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    /\b429\b|\b503\b|resource_exhausted|rate limit|temporarily unavailable/i.test(
      error.message,
    )
  );
}

export function getGeminiRetryDelay(attempt: number): number {
  return Math.min(1_000 * 2 ** Math.max(0, attempt), 4_000);
}
