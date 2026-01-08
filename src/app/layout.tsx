import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import { getSiteSchemas } from "@/lib/schema";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Kyriakos E-Shop",
  description: "Premium E-Commerce Store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteSchemas = getSiteSchemas();
  
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans min-h-screen flex flex-col bg-background antialiased`}>
        <CartProvider>
          <Header />
          {children}
        </CartProvider>
        <script
          dangerouslySetInnerHTML={{ __html: siteSchemas }}
          type="application/ld+json"
        />
      </body>
    </html>
  );
}
