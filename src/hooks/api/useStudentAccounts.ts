"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys, type StudentAccountFilters } from "@/lib/query-keys";

interface StudentAccount {
  nis: string;
  name: string;
  parentName: string;
  parentPhone: string;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  lastPaymentAt: string | null;
  accountCreatedAt: string | null;
  accountDeleted: boolean;
  accountDeletedAt: string | null;
  accountDeletedReason: string | null;
}

interface StudentAccountsResponse {
  success: boolean;
  data: {
    students: StudentAccount[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export function useStudentAccounts(filters: StudentAccountFilters = {}) {
  return useQuery({
    queryKey: queryKeys.studentAccounts.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<StudentAccountsResponse>(
        "/admin/student-accounts",
        {
          params: filters as Record<
            string,
            string | number | boolean | undefined
          >,
        },
      );
      return data.data;
    },
  });
}

export function useCreateStudentAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nis: string) => {
      const { data } = await apiClient.post<{
        success: boolean;
        data: { defaultPassword: string };
      }>(`/admin/students/${nis}/account`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.studentAccounts.all,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
    },
  });
}

export function useResetStudentPassword() {
  return useMutation({
    mutationFn: async (nis: string) => {
      const { data } = await apiClient.post<{
        success: boolean;
        data: { newPassword: string };
      }>(`/admin/students/${nis}/account/reset-password`);
      return data.data;
    },
  });
}

export function useDeleteStudentAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nis, reason }: { nis: string; reason?: string }) => {
      await apiClient.delete(`/admin/students/${nis}/account`, {
        params: { reason: reason || "Manual deletion by admin" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.studentAccounts.all,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
    },
  });
}

export function useRestoreStudentAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nis: string) => {
      await apiClient.post(`/admin/students/${nis}/account/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.studentAccounts.all,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
    },
  });
}
