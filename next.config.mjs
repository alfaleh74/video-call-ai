/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  
  // Prevent TensorFlow from being bundled on server
  // These are browser-only packages and cannot run in Node.js
  serverExternalPackages: [
    '@tensorflow/tfjs',
    '@tensorflow/tfjs-core',
    '@tensorflow/tfjs-backend-webgl',
    '@tensorflow-models/coco-ssd',
    '@tensorflow-models/mobilenet',
  ],
  
  // Turbopack configuration (required in Next.js 16 when webpack config is present)
  turbopack: {},
};

export default nextConfig;
