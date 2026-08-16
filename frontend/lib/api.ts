export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export type ApiError = {
  code: string;
  message: string;
  fields?: Record<string, string>;
};

export class ApiRequestError extends Error {
  constructor(public status: number, public error: ApiError) {
    super(error.message);
  }
}

/**
 * Shared fetch wrapper. Parses the one error contract into ApiRequestError
 * so callers can branch on `error.code` / `error.fields` instead of status
 * codes alone.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let apiError: ApiError = { code: "UNKNOWN", message: `Request failed with ${res.status}` };
    try {
      const body = await res.json();
      if (body?.error) {
        apiError = body.error;
      }
    } catch {
      // response had no JSON body; keep the fallback error above
    }
    throw new ApiRequestError(res.status, apiError);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

/** Same as apiFetch, with the caller's bearer token attached. */
export function authFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
}
