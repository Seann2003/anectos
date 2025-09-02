import type { Metadata } from "next";
import { Barlow_Condensed } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Cross } from "lucide-react";
import { CrossmintProviders } from "@/providers/CrossmintProvider";

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
        className={`${barlow.className} antialiased bg-gradient-to-r from-blue-200 via-blue-400 to-blue-300`}
      >
        <CrossmintProviders>
          <Navbar />
          {children}
        </CrossmintProviders>
      </body>
    </html>
  );
}
