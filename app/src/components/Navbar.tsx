"use client";

import { useState } from "react";
import { useAuth, useWallet } from "@crossmint/client-sdk-react-ui";
import Link from "next/link";
import { useUserRole } from "@/hooks/useUserRole";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { login, logout, user, jwt } = useAuth();
  const { wallet, status: walletStatus } = useWallet();
  const { isAdmin } = useUserRole();

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <nav className="text-white sticky top-0 z-20 justify-between items-center bg-blue backdrop-blur-md p-4 flex">
      <h1 className="text-blue-600 text-4xl font-extrabold pl-10">Anectos</h1>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center space-x-6 text-lg">
        <Link
          href="/"
          className="text-blue-100 hover:text-white transition-colors"
        >
          Home
        </Link>
        <Link
          href="/projects"
          className="text-blue-100 hover:text-white transition-colors"
        >
          Projects
        </Link>
        {/* Governance link removed in DB-only mode */}
        {user && (
          <Link
            href="/proposals"
            className="text-blue-100 hover:text-white transition-colors"
          >
            Proposals
          </Link>
        )}
        {user && isAdmin && (
          <Link
            href="/admin/proposals"
            className="text-blue-100 hover:text-white transition-colors"
          >
            Admin
          </Link>
        )}
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
    </nav>
  );
}
