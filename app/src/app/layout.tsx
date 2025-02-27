import type { Metadata } from "next";
import { Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { SolanaProvider } from "@/components/WalletConnect";
import Navbar from "@/components/Navbar";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: "600",
});

export const metadata: Metadata = {
  title: "Anectos",
  description: "DAO for Regenerative Business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${barlow.className} antialiased bg-gradient-to-r from-[#1B1F4B] via-[#800080] to-[#FF1493]`}
      >
        <SolanaProvider>
          <Navbar />
          {children}
        </SolanaProvider>
      </body>
    </html>
  );
}
