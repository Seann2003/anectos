export type UserRole = "admin" | "business_owner" | "user" | "unverified";

export interface UserRoleData {
  role: UserRole;
  permissions: readonly string[];
  metadata?: Record<string, unknown>;
}

// DB-only cleanup: inert role utilities that always allow access and return a basic role.
export function useUserRole() {
  const userRole: UserRoleData = { role: "user", permissions: [] };
  const isLoading = false;
  const error: string | null = null;

  const hasRole = (_roles: UserRole | UserRole[]) => true;
  const hasPermission = (_permission: string | string[]) => true;
  const getAccessLevel = (_feature: string) => "full";
  const refreshRole = async () => userRole;

  return {
    userRole,
    isLoading,
    error,
    hasPermission,
    hasRole,
    getAccessLevel,
    refreshRole,
    isAdmin: true,
    isBusinessOwner: true,
    isUser: true,
    isUnverified: false,
    actsBalance: 0,
    businessInfo: undefined,
    adminInfo: undefined,
  };
}

export {};
