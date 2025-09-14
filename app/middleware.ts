import { NextResponse, NextRequest } from "next/server";

// Role mapping
// 0: user, 1: business owner, 2: admin
const ROLE = {
  USER: 0,
  OWNER: 1,
  ADMIN: 2,
} as const;

type Role = 0 | 1 | 2;

// Exact allow-list per route prefix
// - Admin (2) can only access /admin
// - Owners (1) can access /business, /profile, /projects
// - Users (0) can access /governance, /profile, /projects
const ACL: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/admin", roles: [ROLE.ADMIN] },
  { prefix: "/business", roles: [ROLE.OWNER] },
  { prefix: "/profile", roles: [ROLE.USER, ROLE.OWNER] },
  { prefix: "/projects", roles: [ROLE.USER, ROLE.OWNER] },
  { prefix: "/governance", roles: [ROLE.USER] },
];

function getRoleFromCookies(req: NextRequest): Role | null {
  const roleStr = req.cookies.get("anectos_role")?.value ?? null;
  if (roleStr == null) return null;
  const num = Number(roleStr);
  if (Number.isNaN(num)) return null;
  if (num < 0 || num > 2) return null;
  return num as Role;
}

function getUidFromCookies(req: NextRequest): string | null {
  return req.cookies.get("anectos_uid")?.value ?? null;
}

function allowedRolesForPath(pathname: string): Role[] | null {
  for (const { prefix, roles } of ACL) {
    if (pathname.startsWith(prefix)) return roles;
  }
  return null;
}

export function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const allowed = allowedRolesForPath(pathname);
  if (allowed == null) {
    return NextResponse.next();
  }

  const uid = getUidFromCookies(req);
  const role = getRoleFromCookies(req);

  // If not authenticated (no uid), send to home (or / if you prefer /login)
  if (!uid) {
    const url = new URL("/", req.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If missing role, treat as lowest role (user)
  const userRole: Role = role ?? ROLE.USER;

  if (!allowed.includes(userRole)) {
    // Not enough permissions; redirect to a safe page
    const url = new URL("/", req.url);
    url.searchParams.set("denied", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/business/:path*",
    "/profile/:path*",
    "/projects/:path*",
    "/governance/:path*",
  ],
};
