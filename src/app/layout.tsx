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
  title: "Maison VIII | Alta Repostería Boutique",
  description: "Boutique de repostería fina y creaciones de autor. Diseños exclusivos y sabor artesanal de lujo.",
  keywords: ["repostería fina", "pasteles de lujo", "Maison Ocho", "Maison VIII", "macarons", "tartas gourmet"],
  authors: [{ name: "Maison VIII Team" }],
  icons: {
    icon: "/logos/favicon_maison.png",
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
