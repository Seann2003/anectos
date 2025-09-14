"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@crossmint/client-sdk-react-ui";
import { useUserRole, UserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, AlertCircle, Loader2, UserX, Lock } from "lucide-react";

interface RoleMiddlewareProps {
  children: ReactNode;
  requiredRoles?: UserRole | UserRole[];
  requiredPermissions?: string | string[];
  fallbackPath?: string;
  showFallback?: boolean;
  customFallback?: ReactNode;
}

export function RoleMiddleware({
  children,
  requiredRoles,
  requiredPermissions,
  fallbackPath = "/",
  showFallback = true,
  customFallback,
}: RoleMiddlewareProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { userRole, isLoading, hasRole, hasPermission, isUnverified } =
    useUserRole();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading) return;

    let accessGranted = true;

    // Check authentication first
    if (!user) {
      accessGranted = false;
    }

    // Check role requirements
    if (accessGranted && requiredRoles) {
      const rolesArray = Array.isArray(requiredRoles)
        ? requiredRoles
        : [requiredRoles];
      accessGranted = hasRole(rolesArray);
    }

    // Check permission requirements
    if (accessGranted && requiredPermissions) {
      const permissionsArray = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];
      accessGranted = permissionsArray.every((permission) =>
        hasPermission(permission)
      );
    }

    setHasAccess(accessGranted);

    // Redirect if access denied and no fallback should be shown
    if (!accessGranted && !showFallback) {
      router.push(fallbackPath);
    }
  }, [
    user,
    userRole,
    isLoading,
    requiredRoles,
    requiredPermissions,
    hasRole,
    hasPermission,
    router,
    fallbackPath,
    showFallback,
  ]);

  // Loading state
  if (isLoading || hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Verifying Access
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Checking your permissions...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access granted
  if (hasAccess) {
    return <>{children}</>;
  }

  // Custom fallback
  if (customFallback) {
    return <>{customFallback}</>;
  }

  // Default access denied screen
  if (showFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-lg">
          <CardContent className="py-12">
            <div className="text-center">
              {!user ? (
                <>
                  <UserX className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Authentication Required
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    You need to be logged in to access this page.
                  </p>
                  <Button onClick={() => router.push("/")} className="mr-4">
                    Go to Home
                  </Button>
                </>
              ) : isUnverified ? (
                <>
                  <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Account Verification Required
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Your account needs to be verified to access this feature.
                    Please complete your profile or connect a wallet.
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={() => router.push("/profile")}
                      className="w-full"
                    >
                      Complete Profile
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/")}
                      className="w-full"
                    >
                      Back to Home
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Lock className="h-16 w-16 text-red-500 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Access Denied
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    You don't have permission to access this page.
                  </p>
                  {userRole && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                      Current role:{" "}
                      <span className="font-medium capitalize">
                        {userRole.role.replace("_", " ")}
                      </span>
                    </p>
                  )}

                  {/* Show required roles/permissions */}
                  {(requiredRoles || requiredPermissions) && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Required Access:
                      </h4>
                      {requiredRoles && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Roles:{" "}
                          {Array.isArray(requiredRoles)
                            ? requiredRoles.join(", ")
                            : requiredRoles}
                        </p>
                      )}
                      {requiredPermissions && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Permissions:{" "}
                          {Array.isArray(requiredPermissions)
                            ? requiredPermissions.join(", ")
                            : requiredPermissions}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button
                      onClick={() => router.push(fallbackPath)}
                      className="w-full"
                    >
                      Go Back
                    </Button>
                    {userRole?.role === "user" && (
                      <Button
                        variant="outline"
                        onClick={() => router.push("/upgrade")}
                        className="w-full"
                      >
                        Upgrade Account
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

// Convenience wrapper components for specific roles
export function AdminOnly({
  children,
  ...props
}: Omit<RoleMiddlewareProps, "requiredRoles">) {
  return (
    <RoleMiddleware requiredRoles="admin" {...props}>
      {children}
    </RoleMiddleware>
  );
}

export function BusinessOwnerOnly({
  children,
  ...props
}: Omit<RoleMiddlewareProps, "requiredRoles">) {
  return (
    <RoleMiddleware requiredRoles="business_owner" {...props}>
      {children}
    </RoleMiddleware>
  );
}

export function AuthenticatedOnly({
  children,
  ...props
}: Omit<RoleMiddlewareProps, "requiredRoles">) {
  return (
    <RoleMiddleware
      requiredRoles={["admin", "business_owner", "user"]}
      {...props}
    >
      {children}
    </RoleMiddleware>
  );
}

export function WithPermission({
  children,
  permission,
  ...props
}: Omit<RoleMiddlewareProps, "requiredPermissions"> & { permission: string }) {
  return (
    <RoleMiddleware requiredPermissions={permission} {...props}>
      {children}
    </RoleMiddleware>
  );
}
