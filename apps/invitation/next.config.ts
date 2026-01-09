/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },

  // DISABLE Image Optimization to save Vercel quota
  // Strategy: Serve pre-optimized WebP images directly from Cloudflare R2
  // Benefits: 
  // - 0 transformations = unlimited images
  // - 0 egress fees (R2 bandwidth is free)
  // - Faster (CDN global)
  // - Cheaper (no quota usage)
  images: {
    unoptimized: true, // Disable Next.js image optimization
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.dev', // Allow all R2 public URLs
      },
      {
        protocol: 'https',
        hostname: 'media.kirimkata.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;


