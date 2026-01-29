const API_BASE = "/api/v1";

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  responseType?: "json" | "blob";
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

    if (response.status === 401) {
      window.location.href = "/login";
    }

    throw new Error(error.error?.message || "Request failed");
  }

  if (options.responseType === "blob") {
    const blob = await response.blob();
    return { data: blob as unknown as T };
  }

  const data = await response.json();
  return { data };
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>("GET", endpoint, undefined, options),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", endpoint, body, options),
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", endpoint, body, options),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>("DELETE", endpoint, undefined, options),
};
