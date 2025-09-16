"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { usePathname, useRouter } from "next/navigation";
import { User, Pencil, LayoutDashboard, LogOut, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast, useSonner } from "sonner";

export default function Navbar() {
  const [name, setName] = useState("");
  const { authenticated, user, logout, login } = usePrivy();
  console.log("Navbar user:", user);
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<0 | 1 | 2 | null>(null);
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    const getCookie = (name: string): string | null => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()!.split(";")[0] ?? null;
      return null;
    };

    const roleStr = getCookie("anectos_role");
    if (roleStr != null) {
      const num = Number(roleStr);
      if (!Number.isNaN(num) && num >= 0 && num <= 2) {
        setRole(num as 0 | 1 | 2);
        return;
      }
    }
    // Default to user when authenticated but missing cookie (middleware also defaults)
    if (authenticated) setRole(0);
    else setRole(null);
  }, [authenticated]);

  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!user) {
        setDisplayName("");
        setName("");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("privy_user_id", user.id)
        .maybeSingle();

      const profileName = data?.name ?? "";
      setName(profileName);

      if (authenticated && !data && pathname !== "/signup") {
        router.push("/signup");
      }

      if (profileName) {
        setDisplayName(profileName);
        return;
      }

      if (user.wallet?.address) {
        setDisplayName(formatAddress(user.wallet.address));
        return;
      }

      if (user.email?.address) {
        setDisplayName(user.email.address);
        return;
      }

      setDisplayName("User");
    };

    fetchDisplayName();
  }, [user]);

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

  return (
    <nav className="text-white sticky top-0 z-20 justify-between items-center bg-blue-500 backdrop-blur-md p-4 flex">
      <h1 className="text-blue-100 text-4xl font-extrabold pl-10">Anectos</h1>

      <div className="hidden md:flex items-center space-x-6 text-lg">
        {authenticated && (
          <Link
            href="/"
            className="text-blue-100 hover:text-white transition-colors"
          >
            Home
          </Link>
        )}
        {authenticated && role !== 2 && (
          <Link
            href="/projects"
            className="text-blue-100 hover:text-white transition-colors"
          >
            Projects
          </Link>
        )}
        {authenticated && role === 0 && (
          <Link
            href="/governance"
            className="text-blue-100 hover:text-white transition-colors"
          >
            Governance
          </Link>
        )}
        {authenticated && role === 1 && (
          <Link
            href="/create/proposal"
            className="text-blue-100 hover:text-white transition-colors"
          >
            Create Proposal
          </Link>
        )}
        {authenticated && role === 2 && (
          <Link
            href="/admin"
            className="text-blue-100 hover:text-white transition-colors"
          >
            Admin
          </Link>
        )}
      </div>

      <div className="flex justify-center items-center space-x-8 text-[20px] pr-[70px] font-normal">
        {!authenticated ? (
          <Button
            type="button"
            onClick={handleLogin}
            className="bg-blue-100 cursor-pointer hover:bg-blue-500 text-black font-semibold py-2 px-4 w-24 rounded transition-colors"
          >
            Login
          </Button>
        ) : (
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="flex items-center space-x-3 bg-blue-200/40 hover:bg-blue-200/60 rounded-lg px-3 py-2 transition-colors ring-1 ring-blue-300/50">
                  <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-bold text-sm">
                      {name
                        ? name.charAt(0).toUpperCase()
                        : displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="text-sm">
                    <p className="text-blue-900 font-medium">{displayName}</p>
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
                      {name
                        ? name.charAt(0).toUpperCase()
                        : displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="leading-tight">
                      <div className="font-semibold text-blue-900  truncate max-w-[11rem]">
                        {displayName}
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
                  onSelect={() => {
                    if (user?.wallet?.address) {
                      navigator.clipboard.writeText(user.wallet.address);
                      toast.success("Wallet address copied to clipboard!");
                    }
                  }}
                >
                  <Copy className="size-4 text-blue-600" />
                  Copy wallet address
                </DropdownMenuItem>
                {role !== 2 && (
                  <>
                    <DropdownMenuItem
                      className="hover:bg-blue-50 focus:bg-blue-50"
                      onSelect={() => {
                        router.push("/profile");
                      }}
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
                  </>
                )}
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
