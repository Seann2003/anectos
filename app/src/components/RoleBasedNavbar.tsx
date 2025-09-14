"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useWallet } from "@crossmint/client-sdk-react-ui";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  Building,
  User,
  ChevronDown,
  Settings,
  LogOut,
  Wallet,
  Award,
} from "lucide-react";

export default function RoleBasedNavbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { login, logout, user, jwt } = useAuth();
  const { wallet, status: walletStatus } = useWallet();
  const {
    userRole,
    isLoading: roleLoading,
    isAdmin,
    isBusinessOwner,
    isUser,
    hasPermission,
    actsBalance,
  } = useUserRole();

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getRoleIcon = () => {
    if (isAdmin) return <Shield className="h-4 w-4" />;
    if (isBusinessOwner) return <Building className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  const getRoleBadgeColor = () => {
    if (isAdmin) return "bg-red-100 text-red-800 border-red-200";
    if (isBusinessOwner) return "bg-blue-100 text-blue-800 border-blue-200";
    if (isUser) return "bg-green-100 text-green-800 border-green-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/contribute");
    router.prefetch("/governance");
    if (hasPermission("access_admin_panel")) {
      router.prefetch("/admin");
    }
    if (hasPermission("access_business_dashboard")) {
      router.prefetch("/business");
    }
  }, [router, hasPermission]);

  return (
    <nav className="bg-blue-300 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Logo */}
        <div className="flex items-center">
          <Link
            href="/"
            className="text-2xl font-bold text-blue-800 hover:text-blue-600 transition-colors"
          >
            Anectos
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center space-x-6">
          <Link
            href="/"
            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors"
          >
            Home
          </Link>

          <Link
            href="/contribute"
            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors"
          >
            Contribute
          </Link>

          {hasPermission("vote_on_governance") && (
            <Link
              href="/governance"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors"
            >
              Governance
            </Link>
          )}

          {hasPermission("access_business_dashboard") && (
            <Link
              href="/business"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors"
            >
              Business
            </Link>
          )}

          {hasPermission("access_admin_panel") && (
            <Link
              href="/admin"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-lg font-medium transition-colors"
            >
              Admin
            </Link>
          )}
        </div>

        {/* User Section */}
        <div className="flex items-center space-x-4">
          {user == null ? (
            <Button
              onClick={login}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Login
            </Button>
          ) : (
            <div className="flex items-center space-x-3">
              {/* User Role Badge */}
              {userRole && !roleLoading && (
                <Badge className={`${getRoleBadgeColor()} border`}>
                  <span className="flex items-center gap-1">
                    {getRoleIcon()}
                    {userRole.role.replace("_", " ").toUpperCase()}
                  </span>
                </Badge>
              )}

              {/* ACTS Balance */}
              {actsBalance > 0 && (
                <div className="flex items-center gap-1 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  <Award className="h-3 w-3" />
                  {actsBalance.toLocaleString()} ACTS
                </div>
              )}

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2"
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user.email?.split("@")[0] || "User"}
                      </p>
                      {wallet && (
                        <p className="text-xs text-gray-600">
                          {formatAddress(wallet.address)}
                        </p>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.email}</p>
                      {userRole && (
                        <p className="text-xs text-gray-500 capitalize">
                          {userRole.role.replace("_", " ")} Account
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  {/* Wallet Info */}
                  {wallet && (
                    <>
                      <DropdownMenuItem disabled>
                        <Wallet className="h-4 w-4 mr-2" />
                        <div className="flex flex-col">
                          <span className="text-xs">Wallet Address</span>
                          <span className="text-xs font-mono">
                            {formatAddress(wallet.address)}
                          </span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {/* Role-specific menu items */}
                  {hasPermission("manage_profile") && (
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <Settings className="h-4 w-4 mr-2" />
                      Profile Settings
                    </DropdownMenuItem>
                  )}

                  {hasPermission("view_contributions") && (
                    <DropdownMenuItem
                      onClick={() => router.push("/my-contributions")}
                    >
                      <Award className="h-4 w-4 mr-2" />
                      My Contributions
                    </DropdownMenuItem>
                  )}

                  {hasPermission("access_business_dashboard") && (
                    <DropdownMenuItem
                      onClick={() => router.push("/business/dashboard")}
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Business Dashboard
                    </DropdownMenuItem>
                  )}

                  {hasPermission("access_admin_panel") && (
                    <DropdownMenuItem
                      onClick={() => router.push("/admin/dashboard")}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Wallet Status Indicator */}
              {walletStatus === "in-progress" && (
                <div className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                  Creating wallet...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
