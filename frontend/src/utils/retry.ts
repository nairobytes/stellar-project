export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  initialDelayMs: number = 300
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries - 1) {
        break;
      }
      const waitMs = initialDelayMs * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw lastError;
}
