import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError, apiFetch, authFetch } from "./api";

function mockFetchResponse(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

describe("apiFetch", () => {
  afterEach(() => vi.restoreAllMocks());

  it("calls the same origin, sends the session cookie and the CSRF header, and never an Authorization header", async () => {
    const fetchMock = mockFetchResponse(200, { ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/cart/items", { method: "POST", body: "{}" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/cart/items");
    expect(init.credentials).toBe("same-origin");
    expect(init.headers["X-Archive-Request"]).toBe("1");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("lets the browser set the multipart boundary for FormData uploads", async () => {
    const fetchMock = mockFetchResponse(200, {});
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/admin/products/p1/images", { method: "POST", body: new FormData() });

    expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBeUndefined();
  });
});

describe("authFetch", () => {
  beforeEach(() => {
    // Stub location so the redirect is observable without jsdom's
    // "Not implemented: navigation" noise from a real href assignment.
    delete (window as unknown as { location?: unknown }).location;
    (window as unknown as { location: Location }).location = {
      href: "",
      pathname: "/cart",
      search: "",
    } as Location;
  });

  afterEach(() => vi.restoreAllMocks());

  it("sends the user to sign in (and back here afterwards) on a 401", async () => {
    vi.stubGlobal("fetch", mockFetchResponse(401, { error: { code: "UNAUTHENTICATED", message: "Sign in to continue." } }));

    await expect(authFetch("/api/cart")).rejects.toBeInstanceOf(ApiRequestError);

    expect(window.location.href).toBe("/login?redirect=%2Fcart");
  });

  it("does not redirect on other failures", async () => {
    vi.stubGlobal("fetch", mockFetchResponse(500, { error: { code: "INTERNAL_ERROR", message: "boom" } }));

    await expect(authFetch("/api/cart")).rejects.toBeInstanceOf(ApiRequestError);

    expect(window.location.href).toBe("");
  });

  it("returns the parsed body on success", async () => {
    vi.stubGlobal("fetch", mockFetchResponse(200, { ok: true }));

    await expect(authFetch("/api/cart")).resolves.toEqual({ ok: true });
  });
});
