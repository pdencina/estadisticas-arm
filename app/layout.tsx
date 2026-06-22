import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ARM Stats · arm global",
  description: "Plataforma de estadísticas multicampus arm global",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.variable}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
