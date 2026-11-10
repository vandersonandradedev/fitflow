import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FitFlow — Gestão de Treinamento e Personal Training",
  description:
    "Plataforma SaaS profissional para personal trainers independentes prescreverem e acompanharem treinamentos com alta velocidade e precisão.",
  keywords: ["personal trainer", "musculação", "treinos", "fitness", "saas", "periodização"],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0C0F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-dvh overflow-x-hidden bg-background text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
