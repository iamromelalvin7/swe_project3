import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError, authFetch } from "./api";
import { AUTH_STORAGE_KEY } from "./auth";

function mockFetchResponse(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

describe("authFetch", () => {
  beforeEach(() => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: "stale-token" }));
    // Stub location so the redirect is observable without jsdom's
    // "Not implemented: navigation" noise from a real href assignment.
    delete (window as unknown as { location?: unknown }).location;
    (window as unknown as { location: Location }).location = {
      href: "",
      pathname: "/cart",
    } as Location;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("clears the stored session and redirects to /login on a 401", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchResponse(401, { error: { code: "UNAUTHENTICATED", message: "Sign in to continue." } })
    );

    await expect(authFetch("/api/cart", "stale-token")).rejects.toBeInstanceOf(ApiRequestError);

    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(window.location.href).toContain("/login");
  });

  it("leaves the session untouched on a non-401 failure", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchResponse(500, { error: { code: "INTERNAL_ERROR", message: "boom" } })
    );

    await expect(authFetch("/api/cart", "stale-token")).rejects.toBeInstanceOf(ApiRequestError);

    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).not.toBeNull();
    expect(window.location.href).toBe("");
  });

  it("returns the parsed body on success and leaves the session alone", async () => {
    vi.stubGlobal("fetch", mockFetchResponse(200, { ok: true }));

    await expect(authFetch("/api/cart", "stale-token")).resolves.toEqual({ ok: true });

    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).not.toBeNull();
  });
});
