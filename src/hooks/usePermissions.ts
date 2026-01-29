"use client";

import { useAuth } from "./useAuth";

export function usePermissions() {
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";
  const isCashier = user?.role === "CASHIER";

  return {
    canCreate: isAdmin,
    canUpdate: isAdmin,
    canDelete: isAdmin,
    canProcessPayment: isAdmin || isCashier,
    canViewReports: isAdmin || isCashier,
    canManageEmployees: isAdmin,
    canGenerateTuition: isAdmin,
    canManageScholarships: isAdmin,
  };
}
