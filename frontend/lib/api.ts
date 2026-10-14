/**
 * Where API requests go.
 * - In the browser: the shop's own origin. next.config.mjs rewrites /api/* to
 *   the backend, so the HttpOnly session cookie is first-party and is sent
 *   automatically — the page's JavaScript never sees the token.
 * - On the server (React Server Components): straight to the backend. Server
 *   renders only fetch public data, so they never need the cookie.
 */
export const API_BASE_URL = typeof window === "undefined" ? (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "") : "";

/** Must match the backend's CsrfHeaderFilter. */
const CSRF_HEADERS = { "X-Archive-Request": "1" };

export type ApiError = {
  code: string;
  message: string;
  fields?: Record<string, string>;
};

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public error: ApiError
  ) {
    super(error.message);
  }
}

async function parseError(res: Response): Promise<ApiRequestError> {
  let apiError: ApiError = { code: "UNKNOWN", message: `Request failed with ${res.status}` };
  try {
    const body = await res.json();
    if (body?.error) apiError = body.error;
  } catch {
    // response had no JSON body; keep the fallback error above
  }
  return new ApiRequestError(res.status, apiError);
}

/**
 * Shared fetch wrapper. Parses the one error contract into ApiRequestError
 * so callers can branch on `error.code` / `error.fields` instead of status
 * codes alone. Sends the session cookie (same-origin) and the CSRF header.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "same-origin",
    ...init,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...CSRF_HEADERS,
      ...init?.headers,
    },
  });

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/**
 * apiFetch for signed-in endpoints. A 401 always means the session cookie
 * is missing or expired (the backend never uses 401 for anything else on an
 * authenticated route), so it's treated as a forced sign-out: back to the
 * sign-in page, returning here afterwards.
 */
export async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await apiFetch<T>(path, init);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 401 && typeof window !== "undefined") {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${redirect}`;
    }
    throw err;
  }
}
