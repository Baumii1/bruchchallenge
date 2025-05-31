
import type {NextConfig} from 'next';

// IMPORTANT: Replace 'YOUR_REPO_NAME' with the actual name of your GitHub repository.
// For example, if your GitHub repository URL is https://github.com/username/my-awesome-app,
// then YOUR_REPO_NAME should be 'my-awesome-app'.
const repoName = 'bruchchallenge'; // Adjusted based on your GitHub remote URL

const nextConfig: NextConfig = {
  output: 'export',
  // basePath will make your app accessible at https://your-username.github.io/YOUR_REPO_NAME
  basePath: process.env.NODE_ENV === 'production' ? `/${repoName}` : '',
  // assetPrefix also needs to be set if you are using a custom domain with GitHub Pages
  // and your repo is not at the root. For typical username.github.io/repo-name setup,
  // basePath is often sufficient, but assetPrefix can ensure all assets are correctly prefixed.
  // For simplicity with basePath, we'll rely on it to prefix assets. If you encounter issues,
  // you might also need: assetPrefix: process.env.NODE_ENV === 'production' ? `/${repoName}/` : '',

  typescript: {
    ignoreBuildErrors: true, // Temporarily set to true
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
