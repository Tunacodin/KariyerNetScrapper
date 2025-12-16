/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // CSV dosyalarını static olarak serve et
  async headers() {
    return [
      {
        source: '/api/csv',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json; charset=utf-8',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
