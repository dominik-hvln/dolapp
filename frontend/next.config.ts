import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ['react-leaflet'],
    output: 'standalone',
};

export default nextConfig;
