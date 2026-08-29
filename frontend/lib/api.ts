import { AUTH_STORAGE_KEY } from "./auth";

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

/**
 * Same as apiFetch, with the caller's bearer token attached. A 401 here
 * always means the token itself was rejected (expired or invalid) — the
 * backend never uses 401 for anything else on an authenticated route — so
 * we treat it as a forced sign-out rather than a generic failure. Without
 * this, a stale token leaves every authenticated page stuck retrying with
 * the same doomed token until the user happens to sign out and back in.
 */
export async function authFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  try {
    return await apiFetch<T>(path, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    });
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      const redirect = encodeURIComponent(window.location.pathname);
      window.location.href = `/login?redirect=${redirect}`;
    }
    throw err;
  }
}
