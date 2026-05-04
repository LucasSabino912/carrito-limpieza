import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 1. IMPORTAMOS EL PROVIDER ACÁ
// (Ojo con las mayúsculas/minúsculas de tu archivo, fijate si lo guardaste como cartContext o CartContext)
import { CartProvider } from '@/context/cartContext'; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "La Gotita Mayorista",
  description: "Mayorista de artículos de limpieza",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        
        {/* 2. ENVOLVEMOS LOS CHILDREN CON EL PROVIDER */}
        <CartProvider>
          {children}
        </CartProvider>
        
      </body>
    </html>
  );
}