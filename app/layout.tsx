import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MedClinic - Sistema de Gestão",
  description: "Dashboard de gerenciamento de clínica médica",
  icons: {
    icon: [
      {
        url: "/",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased flex h-screen overflow-hidden`}>
        {/* A Sidebar fica fixa na esquerda */}
        <Sidebar />

        {/* O conteúdo das páginas fica na direita e tem scroll próprio */}
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </body>
    </html>
  );
}

