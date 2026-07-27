import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Next 16 blocks cross-origin dev requests by default: the page HTML still
  // renders but /_next assets are refused, so the app never hydrates and no
  // data loads. These are the origins the studio is reached from in
  // development — the LAN address and any Cloudflare quick tunnel, whose
  // hostname is regenerated every time one is started.
  allowedDevOrigins: ["192.168.1.81", "*.trycloudflare.com"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
