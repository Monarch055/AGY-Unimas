// Where the Next server forwards /v1 and /ai/v1 when no reverse proxy sits in front of it
// (local dev, or a deploy that only exposes the web container). Behind Caddy these paths
// never reach Next because Caddy routes them first.
const CORE_API_INTERNAL_URL = process.env.CORE_API_INTERNAL_URL || 'http://localhost:8080';
const AI_AGENT_INTERNAL_URL = process.env.AI_AGENT_INTERNAL_URL || 'http://localhost:8081';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@rekasains/shared-types', '@rekasains/shared-core'],
  // LLM-backed agent calls can take longer than the 30s default proxy timeout.
  experimental: { proxyTimeout: 120_000 },
  async rewrites() {
    return [
      { source: '/v1/:path*', destination: `${CORE_API_INTERNAL_URL}/v1/:path*` },
      { source: '/ai/v1/:path*', destination: `${AI_AGENT_INTERNAL_URL}/ai/v1/:path*` },
    ];
  },
};

export default nextConfig;
