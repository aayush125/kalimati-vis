import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.module.rules.push({
      test: /\.node$/,
      loader: "node-loader",
    });

    config.externals.push({
      "nodejs-polars": "commonjs nodejs-polars",
    });

    return config;
  },
};

export default nextConfig;
