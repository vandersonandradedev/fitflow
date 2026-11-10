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
        src: "/images/exercises/push.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
