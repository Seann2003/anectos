"use client";

import { useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { User, Pencil, LayoutDashboard, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { authenticated, user, logout, login } = usePrivy();
  console.log("Authenticated:", user);
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogin = () => {
    login();
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getUserDisplayName = () => {
    if (!user) return "";

    if (user.email?.address) {
      return user.email.address;
    }

    if (user.wallet?.address) {
      return formatAddress(user.wallet.address);
    }

    return "User";
  };

  return (
    <nav className="text-white sticky top-0 z-20 justify-between items-center bg-blue-500 backdrop-blur-md p-4 flex">
      <h1 className="text-blue-100 text-4xl font-extrabold pl-10">Anectos</h1>

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
        {authenticated && (
          <Link
            href="/proposals"
            className="text-blue-100 hover:text-white transition-colors"
          >
            Proposals
          </Link>
        )}
        {authenticated && isAdmin && (
          <Link
            href="/admin/proposals"
            className="text-blue-100 hover:text-white transition-colors"
          >
            Admin
          </Link>
        )}
      </div>

      <div className="flex justify-center items-center space-x-8 text-[20px] pr-[70px] font-normal">
        {!authenticated ? (
          <button
            type="button"
            onClick={handleLogin}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Login
          </button>
        ) : (
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="flex items-center space-x-3 bg-blue-200/40 hover:bg-blue-200/60 rounded-lg px-3 py-2 transition-colors ring-1 ring-blue-300/50">
                  <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-bold text-sm">
                      {getUserDisplayName().charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="text-sm">
                    <p className="text-blue-900 font-medium">
                      {getUserDisplayName()}
                    </p>
                    {user?.wallet?.address && (
                      <p className="text-blue-600 text-xs">
                        {formatAddress(user.wallet.address)}
                      </p>
                    )}
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-64 p-2 rounded-xl shadow-xl bg-white/95 border border-blue-100 shadow-blue-100/50 backdrop-blur-md "
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-300/20 text-blue-700 rounded-full flex items-center justify-center font-semibold">
                      {getUserDisplayName().charAt(0).toUpperCase()}
                    </div>
                    <div className="leading-tight">
                      <div className="font-semibold text-blue-900  truncate max-w-[11rem]">
                        {getUserDisplayName()}
                      </div>
                      {user?.email?.address && (
                        <div className="text-xs text-blue-700/80 truncate max-w-[11rem]">
                          {user.email.address}
                        </div>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="hover:bg-blue-50 focus:bg-blue-50"
                  onSelect={() => router.push("/profile")}
                >
                  <User className="size-4 text-blue-600" />
                  View profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:bg-blue-50 focus:bg-blue-50"
                  onSelect={() => router.push("/profile/edit")}
                >
                  <Pencil className="size-4 text-blue-600" />
                  Edit username
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="hover:bg-red-50 focus:bg-red-50"
                  variant="destructive"
                  onSelect={handleLogout}
                >
                  <LogOut className="size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </nav>
  );
}
