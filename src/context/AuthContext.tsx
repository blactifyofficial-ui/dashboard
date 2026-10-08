'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { UserRole } from '@/db/schema';
import { Permission, hasPermission as checkHasPermission } from '@/lib/rbac';

export interface UserAuthContextType {
  user: {
    id: string;
    email: string;
    name?: string | null;
  } | null;
  role: UserRole;
  partnerId: string | null;
  permissions: string[];
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<UserAuthContextType>({
  user: null,
  role: 'VIEWER',
  partnerId: null,
  permissions: [],
  hasPermission: () => false,
});

export function AuthProvider({
  children,
  initialUser,
  initialRole = 'VIEWER',
  initialPartnerId = null,
  initialPermissions = [],
}: {
  children: React.ReactNode;
  initialUser: UserAuthContextType['user'];
  initialRole?: UserRole;
  initialPartnerId?: string | null;
  initialPermissions?: string[];
}) {
  const value = useMemo<UserAuthContextType>(() => {
    return {
      user: initialUser,
      role: initialRole,
      partnerId: initialPartnerId,
      permissions: initialPermissions,
      hasPermission: (permission: Permission) =>
        checkHasPermission(initialRole, permission, initialPermissions),
    };
  }, [initialUser, initialRole, initialPartnerId, initialPermissions]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): UserAuthContextType {
  return useContext(AuthContext);
}

/**
 * Reusable wrapper to conditionally render UI based on permissions.
 */
export function Authorize({
  permission,
  roles,
  children,
  fallback = null,
}: {
  permission?: Permission;
  roles?: readonly UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { role, hasPermission } = useAuth();

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  if (roles && !roles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
