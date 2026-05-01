/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  images: {
    domains: ['search1.kakaocdn.net', 'thumbnail.image.kakao.com'],
  },
}

module.exports = nextConfig
