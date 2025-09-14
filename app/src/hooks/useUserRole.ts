import { useState, useEffect, useCallback } from "react";
import { useAuth, useWallet } from "@crossmint/client-sdk-react-ui";
import { getActsTokenBalance, checkAdminPrivileges } from "@/lib/token-utils";

export type UserRole = "admin" | "business_owner" | "user" | "unverified";

export interface UserRoleData {
  role: UserRole;
  permissions: readonly string[];
  metadata: {
    actsBalance: number;
    verifiedAt?: string;
    businessInfo?: {
      companyName: string;
      registrationNumber: string;
      verifiedAt: string;
    };
    adminInfo?: {
      grantedAt: string;
      grantedBy: string;
      level: "super_admin" | "moderator" | "project_admin";
    };
  };
}

// Role permissions mapping
const ROLE_PERMISSIONS = {
  admin: [
    "create_governance_proposal",
    "manage_users",
    "whitelist_projects",
    "access_admin_panel",
    "moderate_content",
    "manage_funding_rounds",
    "view_analytics",
    "system_configuration",
  ],
  business_owner: [
    "create_project",
    "manage_own_projects",
    "view_project_analytics",
    "create_funding_requests",
    "respond_to_governance",
    "access_business_dashboard",
  ],
  user: [
    "contribute_to_projects",
    "vote_on_governance",
    "view_projects",
    "manage_profile",
    "view_contributions",
  ],
  unverified: ["view_projects", "view_public_content"],
} as const;

// Admin wallet addresses (in production, store in database)
const ADMIN_WALLET_ADDRESSES = new Set([
  // Add your admin wallet addresses here
  "ADMIN_WALLET_1",
  "ADMIN_WALLET_2",
]);

// Business owner verification (in production, integrate with business verification service)
const VERIFIED_BUSINESS_OWNERS = new Map<
  string,
  {
    companyName: string;
    registrationNumber: string;
    verifiedAt: string;
  }
>([
  // Example: user_id -> business info
  // ['user_123', {
  //   companyName: 'Green Tech Solutions',
  //   registrationNumber: 'GTX123456',
  //   verifiedAt: '2024-01-15T10:00:00Z'
  // }]
]);

export function useUserRole() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const [userRole, setUserRole] = useState<UserRoleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Determine user role based on multiple factors
   */
  const determineUserRole = useCallback(async (): Promise<UserRoleData> => {
    if (!user || !wallet?.address) {
      return {
        role: "unverified",
        permissions: ROLE_PERMISSIONS.unverified,
        metadata: {
          actsBalance: 0,
        },
      };
    }

    try {
      // Get user's ACTS token balance
      const actsBalance = await getActsTokenBalance(wallet.address);

      // Check if user is admin (multiple criteria)
      const isAdmin = await checkAdminStatus(user, wallet.address, actsBalance);
      if (isAdmin.isAdmin) {
        return {
          role: "admin",
          permissions: ROLE_PERMISSIONS.admin,
          metadata: {
            actsBalance,
            adminInfo: isAdmin.adminInfo,
          },
        };
      }

      // Check if user is verified business owner
      const businessInfo = await checkBusinessOwnerStatus(user);
      if (businessInfo) {
        return {
          role: "business_owner",
          permissions: ROLE_PERMISSIONS.business_owner,
          metadata: {
            actsBalance,
            businessInfo,
            verifiedAt: businessInfo.verifiedAt,
          },
        };
      }

      // Default to regular user if wallet is connected
      return {
        role: "user",
        permissions: ROLE_PERMISSIONS.user,
        metadata: {
          actsBalance,
          verifiedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Error determining user role:", error);
      return {
        role: "unverified",
        permissions: ROLE_PERMISSIONS.unverified,
        metadata: {
          actsBalance: 0,
        },
      };
    }
  }, [user, wallet?.address]);

  /**
   * Check admin status using multiple criteria
   */
  const checkAdminStatus = async (
    user: any,
    walletAddress: string,
    actsBalance: number
  ): Promise<{
    isAdmin: boolean;
    adminInfo?: any;
  }> => {
    // Method 1: Check wallet address against admin list
    if (ADMIN_WALLET_ADDRESSES.has(walletAddress)) {
      return {
        isAdmin: true,
        adminInfo: {
          grantedAt: "2024-01-01T00:00:00Z",
          grantedBy: "system",
          level: "super_admin",
        },
      };
    }

    // Method 2: Check ACTS token threshold (10,000+ tokens)
    if (actsBalance >= 10000) {
      return {
        isAdmin: true,
        adminInfo: {
          grantedAt: new Date().toISOString(),
          grantedBy: "token_threshold",
          level: "project_admin",
        },
      };
    }

    // Method 3: Check Crossmint user metadata (if you store role info there)
    if (user.metadata?.role === "admin") {
      return {
        isAdmin: true,
        adminInfo: {
          grantedAt: user.metadata.adminGrantedAt || new Date().toISOString(),
          grantedBy: user.metadata.adminGrantedBy || "system",
          level: user.metadata.adminLevel || "moderator",
        },
      };
    }

    return { isAdmin: false };
  };

  /**
   * Check business owner verification status
   */
  const checkBusinessOwnerStatus = async (
    user: any
  ): Promise<{
    companyName: string;
    registrationNumber: string;
    verifiedAt: string;
  } | null> => {
    // Method 1: Check local verification map (demo)
    const businessInfo = VERIFIED_BUSINESS_OWNERS.get(user.id);
    if (businessInfo) {
      return businessInfo;
    }

    // Method 2: Check Crossmint user metadata
    if (user.metadata?.businessVerified) {
      return {
        companyName: user.metadata.companyName,
        registrationNumber: user.metadata.registrationNumber,
        verifiedAt: user.metadata.businessVerifiedAt,
      };
    }

    // Method 3: In production, check external business verification service
    // const verification = await verifyBusinessStatus(user.email);

    return null;
  };

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      return userRole?.permissions.includes(permission) || false;
    },
    [userRole]
  );

  /**
   * Check if user has any of the specified roles
   */
  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!userRole) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(userRole.role);
    },
    [userRole]
  );

  /**
   * Get user's access level for a specific feature
   */
  const getAccessLevel = useCallback(
    (feature: string) => {
      if (!userRole) return "none";

      switch (feature) {
        case "governance":
          if (hasRole("admin")) return "full";
          if (hasRole(["business_owner", "user"])) return "vote";
          return "view";

        case "projects":
          if (hasRole("admin")) return "manage_all";
          if (hasRole("business_owner")) return "manage_own";
          if (hasRole("user")) return "contribute";
          return "view";

        case "admin_panel":
          if (hasRole("admin")) return "full";
          return "none";

        default:
          return "view";
      }
    },
    [userRole, hasRole]
  );

  /**
   * Refresh user role (useful after role changes)
   */
  const refreshRole = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const roleData = await determineUserRole();
      setUserRole(roleData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [determineUserRole]);

  // Initial role determination
  useEffect(() => {
    refreshRole();
  }, [user, wallet?.address, refreshRole]);

  return {
    userRole,
    isLoading,
    error,
    hasPermission,
    hasRole,
    getAccessLevel,
    refreshRole,

    // Convenience getters
    isAdmin: hasRole("admin"),
    isBusinessOwner: hasRole("business_owner"),
    isUser: hasRole("user"),
    isUnverified: hasRole("unverified"),

    // Role-specific data
    actsBalance: userRole?.metadata.actsBalance || 0,
    businessInfo: userRole?.metadata.businessInfo,
    adminInfo: userRole?.metadata.adminInfo,
  };
}
