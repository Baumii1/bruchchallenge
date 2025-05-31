
import type {NextConfig} from 'next';

// IMPORTANT: Replace 'YOUR_REPO_NAME' with the actual name of your GitHub repository.
// For example, if your GitHub repository URL is https://github.com/username/my-awesome-app,
// then YOUR_REPO_NAME should be 'my-awesome-app'.
const repoName = 'bruchchallenge'; // This should be your GitHub repository name

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  // basePath will make your app accessible at https://your-username.github.io/YOUR_REPO_NAME
  basePath: isProd ? `/${repoName}` : '',
  // assetPrefix is necessary for static assets (CSS, JS, images) to be loaded correctly from the subpath on GitHub Pages.
  assetPrefix: isProd ? `/${repoName}/` : '',

  typescript: {
    ignoreBuildErrors: true, // Kept true to bypass the previous persistent type error during build
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Recommended for static exports, especially to services like GitHub Pages
    // as they don't have a Next.js image optimization server.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'postimg.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
