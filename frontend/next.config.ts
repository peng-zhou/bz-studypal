import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost'],
  },
  // App Router 中不需要 i18n 配置
  // 将使用 app/[locale] 目录结构来处理国际化
  typescript: {
    // Ignore Cypress build errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
