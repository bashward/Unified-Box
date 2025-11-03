/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.twilio.com" },
      { protocol: "https", hostname: "mms.twil.io" },
    ],
  },
};

export default nextConfig;
