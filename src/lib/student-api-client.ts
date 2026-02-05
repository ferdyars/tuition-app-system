/**
 * Student Portal API Client
 * Similar to apiClient but redirects to /portal/login on 401
 */

const API_BASE = "/api/v1";

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<{ data: T }> {
  const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);

  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body
      ? body instanceof FormData
        ? body
        : JSON.stringify(body)
      : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: { message: response.statusText },
    }));

    // Redirect to student portal login on 401
    if (response.status === 401) {
      window.location.href = "/portal/login";
    }

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = error.error?.retryAfter || 60;
      throw new RateLimitError(
        error.error?.message || "Too many requests",
        retryAfter,
      );
    }

    throw new Error(error.error?.message || "Request failed");
  }

  const data = await response.json();
  return { data };
}

export class RateLimitError extends Error {
  retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export const studentApiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>("GET", endpoint, undefined, options),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", endpoint, body, options),
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", endpoint, body, options),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>("DELETE", endpoint, undefined, options),
};
