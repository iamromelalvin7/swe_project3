/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // The client-side Router Cache otherwise serves a stale render when
    // navigating to the same route with only searchParams changed (the
    // catalog's filter bar does exactly this) — every product page fetch
    // is already `cache: "no-store"`, so opt dynamic pages out of the
    // Router Cache's stale-while-revalidate window entirely.
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
