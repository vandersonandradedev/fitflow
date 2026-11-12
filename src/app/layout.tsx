import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { PwaServiceWorkerRegister } from "@/components/pwa-service-worker-register";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import { SessionActivityMonitor } from "@/components/session-activity-monitor";
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
  applicationName: "FitFlow",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FitFlow",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#090B0E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FitFlow" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-dvh overflow-x-hidden bg-background text-foreground antialiased`}
      >
        <PwaServiceWorkerRegister />
        <PwaInstallBanner />
        <SessionActivityMonitor />
        {children}
      </body>
    </html>
  );
}
