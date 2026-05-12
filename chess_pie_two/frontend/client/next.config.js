const createNextIntlPlugin = require("next-intl/plugin");

const nextConfig = {
  // Redirects: www → non-www
  trailingSlash: false,
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.chessperiment.app",
          },
        ],
        destination: "https://chessperiment.app/:path*",
        permanent: true,
      },
      {
        source: "/:locale/news",
        destination: "/:locale/announcements",
        permanent: true,
      },
      {
        source: "/news",
        destination: "/announcements",
        permanent: true,
      },
      {
        source: "/:locale/editor/board/:path*",
        destination: "/:locale/editor",
        permanent: true,
      },
      {
        source: "/:locale/editor/piece/:path*",
        destination: "/:locale/editor",
        permanent: true,
      },
      {
        source: "/editor/board/:path*",
        destination: "/editor",
        permanent: true,
      },
      {
        source: "/editor/piece/:path*",
        destination: "/editor",
        permanent: true,
      },
    ];
  },

  // HSTS Header erzwingen
  async headers() {
    return [
      {
        source: "/(.*)", // Alle Seiten
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
const { withBotId } = require("botid/next/config");

module.exports = withBotId(withNextIntl(nextConfig));
