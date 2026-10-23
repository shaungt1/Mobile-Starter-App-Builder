export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 15_000,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      throw new ApiError(`Request failed with ${response.status}`, response.status);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}
