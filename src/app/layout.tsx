import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Maison VIII | Repostería Fina de Autor en Los Mochis",
  description: "Boutique de repostería fina de autor en Los Mochis, Sinaloa. Creadores de roles de canela, New York rolls, galletas estilo New York y tartas exclusivas bajo los más altos estándares de calidad.",
  keywords: [
    "repostería fina Los Mochis",
    "repostería de autor Sinaloa",
    "Maison Ocho Los Mochis",
    "Maison VIII Sinaloa",
    "roles de canela",
    "New York rolls Los Mochis",
    "galletas estilo New York",
    "tartas gourmet",
    "repostería fina"
  ],
  authors: [{ name: "Maison VIII Team" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
