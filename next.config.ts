import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "agsvbhzvlwygpnxygtnt.supabase.co",
        pathname: "/storage/v1/object/public/file/**",
      },
    ],
  },
};

export default nextConfig;
