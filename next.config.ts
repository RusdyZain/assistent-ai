import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow forwarded development hosts (VS Code Dev Tunnels, ngrok, etc.)
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "*.devtunnels.ms",
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.trycloudflare.com",
  ],
};

export default nextConfig;
