/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Turbopack scoped to this app when the repository lives inside a
  // directory that also contains a lockfile.
  turbopack: {
    root: process.cwd(),
  },
  // Allow opening the dev server from a phone on the same Wi-Fi (e.g. http://192.168.29.124:3000).
  // Next.js blocks dev scripts for non-localhost origins by default.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  // Enable gzip compression for all responses
  compress: true,
  // Keep Server Action uploads below Vercel's request-body ceiling.
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  // Strip console.* calls in production bundles to reduce noise and bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
        port: "",
        pathname: "/api/portraits/**",
      },
    ],
  },
};
export default nextConfig;
