"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

interface BankAccount {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  logoUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  pendingPayments: number;
}

interface BankAccountsResponse {
  success: boolean;
  data: {
    bankAccounts: BankAccount[];
  };
}

interface BankAccountResponse {
  success: boolean;
  data: BankAccount;
}

export function useBankAccounts() {
  return useQuery({
    queryKey: queryKeys.bankAccounts.list(),
    queryFn: async () => {
      const { data } = await apiClient.get<BankAccountsResponse>(
        "/admin/bank-accounts",
      );
      return data.data.bankAccounts;
    },
  });
}

export function useBankAccount(id: string) {
  return useQuery({
    queryKey: queryKeys.bankAccounts.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<BankAccountResponse>(
        `/admin/bank-accounts/${id}`,
      );
      return data.data;
    },
    enabled: !!id,
  });
}

interface BankAccountInput {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  logoUrl?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BankAccountInput) => {
      const { data } = await apiClient.post<BankAccountResponse>(
        "/admin/bank-accounts",
        input,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts.all });
    },
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: BankAccountInput & { id: string }) => {
      const { data } = await apiClient.put<BankAccountResponse>(
        `/admin/bank-accounts/${id}`,
        input,
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bankAccounts.detail(variables.id),
      });
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/bank-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts.all });
    },
  });
}
