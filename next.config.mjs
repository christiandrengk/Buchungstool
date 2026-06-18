/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Spätere iframe-Einbettung in die Institutswebseite:
  // Standardmäßig erlauben wir hier das Einbetten nicht (Sicherheit).
  // Zum Einbetten die erlaubte Eltern-Domain in ALLOWED_FRAME_ANCESTOR setzen.
  async headers() {
    const frameAncestor = process.env.ALLOWED_FRAME_ANCESTOR;
    const csp = frameAncestor
      ? `frame-ancestors 'self' ${frameAncestor};`
      : `frame-ancestors 'self';`;
    return [
      {
        source: "/:path*",
        headers: [{ key: "Content-Security-Policy", value: csp }],
      },
    ];
  },
};

export default nextConfig;
