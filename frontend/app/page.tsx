type HealthResponse = {
  status: string;
};

async function getHealth(): Promise<{ ok: true; data: HealthResponse } | { ok: false; error: string }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return { ok: false, error: "NEXT_PUBLIC_API_URL is not set" };
  }

  try {
    const res = await fetch(`${apiUrl}/api/health`, { cache: "no-store" });
    if (!res.ok) {
      return { ok: false, error: `Backend responded ${res.status}` };
    }
    const data = (await res.json()) as HealthResponse;
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Could not reach the backend" };
  }
}

export default async function Home() {
  const result = await getHealth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="font-heading text-4xl">ARCHIVE 233</h1>
      <p className="font-body text-neutral-700">Phase 1 — backend pipe check</p>
      <pre className="rounded-md border border-divider bg-surface px-4 py-3 font-body text-sm">
        {result.ok ? JSON.stringify(result.data, null, 2) : `error: ${result.error}`}
      </pre>
    </main>
  );
}
