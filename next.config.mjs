/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: '/reportes', destination: '/analiticas', permanent: true }];
  },
};

export default nextConfig;
