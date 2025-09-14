"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useWallet } from "@crossmint/client-sdk-react-ui";

interface PerformantNavbarProps {}

export default function Navbar({}: PerformantNavbarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { login, logout, user, jwt } = useAuth();
  const { wallet, status: walletStatus } = useWallet();

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/projects");
    router.prefetch("/admin");
  }, [router]);

  return (
    <nav className="bg-blue-300 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex items-center">
          <Link
            href="/"
            className="text-2xl font-bold text-blue-800 hover:text-blue-600 transition-colors"
          >
            Anectos
          </Link>
        </div>

        <div className="flex items-center space-x-8">
          <Link
            href="/"
            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors"
          >
            Home
          </Link>
          <Link
            href="/projects"
            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors"
          >
            Projects
          </Link>
          <Link
            href="/contribute"
            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors"
          >
            Contribute
          </Link>
          {/* Governance link removed in DB-only mode */}
          <Link
            href="/admin"
            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors"
          >
            Admin
          </Link>
          {/* Wallet page removed in DB-only mode */}
        </div>

        <div className="flex justify-center items-center space-x-8 text-[20px] pr-[70px] font-normal">
          {user == null ? (
            <button
              type="button"
              onClick={login}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Login
            </button>
          ) : (
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="text-blue-100">Welcome, {user?.email}</p>
                {wallet && (
                  <p className="text-blue-200">
                    Wallet: {formatAddress(wallet.address)}
                  </p>
                )}
                {walletStatus === "in-progress" && (
                  <p className="text-yellow-300">Creating wallet...</p>
                )}
              </div>
              <button
                type="button"
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
