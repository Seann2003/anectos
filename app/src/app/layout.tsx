import type { Metadata } from "next";
import { Barlow_Condensed } from "next/font/google";
import "./globals.css";
import RoleBasedNavbar from "@/components/RoleBasedNavbar";
import { CrossmintProviders } from "@/providers/CrossmintProvider";
import { Toaster } from "sonner";
import { WalletGate } from "@/components/middleware/WalletGate";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: "600",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anectos",
  description: "DAO for Regenerative Business",
  icons: {
    icon: "/anectos.png",
    shortcut: "/anectos.png",
    apple: "/apple-touch-icon.png",
  },
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
          <RoleBasedNavbar />
          <WalletGate>
            <main className="min-h-screen">{children}</main>
          </WalletGate>
          <Toaster position="top-right" richColors />
        </CrossmintProviders>
      </body>
    </html>
  );
}
