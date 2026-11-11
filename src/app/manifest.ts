import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FitFlow — Gestão & Treinamento Físico",
    short_name: "FitFlow",
    description: "SaaS de gestão de personal trainers e prescrição de treinamento físico.",
    start_url: "/student/today",
    display: "standalone",
    background_color: "#090B0E",
    theme_color: "#10B981",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
