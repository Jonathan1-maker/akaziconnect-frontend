/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.onrender.com' },
      { protocol: 'http',  hostname: 'localhost', port: '5000', pathname: '/uploads/**' },
    ],
  },
};

export default nextConfig;
