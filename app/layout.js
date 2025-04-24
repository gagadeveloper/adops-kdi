"use client"; // Tetap butuh ini agar bisa pakai SessionProvider

import { Inter, Roboto_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react"; // Tambahkan SessionProvider
import "./globals.css";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <SessionProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </SessionProvider>
  );
}
