"use client";

import { ReactNode } from "react";

export type UserRole = "admin" | "business_owner" | "user" | "unverified";

interface RoleMiddlewareProps {
  children: ReactNode;
  requiredRoles?: UserRole | UserRole[];
  requiredPermissions?: string | string[];
  fallbackPath?: string;
  showFallback?: boolean;
  customFallback?: ReactNode;
}

// DB-only cleanup: All role checks removed. Always render children.
export function RoleMiddleware({ children }: RoleMiddlewareProps) {
  return <>{children}</>;
}

// Convenience wrappers now simply render children without checks.
export function AdminOnly({
  children,
}: Omit<RoleMiddlewareProps, "requiredRoles">) {
  return <>{children}</>;
}

export function BusinessOwnerOnly({
  children,
}: Omit<RoleMiddlewareProps, "requiredRoles">) {
  return <>{children}</>;
}

export function AuthenticatedOnly({
  children,
}: Omit<RoleMiddlewareProps, "requiredRoles">) {
  return <>{children}</>;
}

export function WithPermission({
  children,
}: Omit<RoleMiddlewareProps, "requiredPermissions"> & { permission: string }) {
  return <>{children}</>;
}
