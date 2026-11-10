import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
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
  maximumScale: 1,
  userScalable: false,
  themeColor: "#090B0E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} font-sans min-h-screen bg-[#090B0E] text-[#F3F5F7] antialiased`}>
        {children}
      </body>
    </html>
  );
}
