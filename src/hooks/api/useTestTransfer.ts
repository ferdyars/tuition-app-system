"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

interface PaymentRequest {
  id: string;
  status: string;
  totalAmount: string;
  baseAmount: string;
  uniqueCode: number;
  expiresAt: string;
  createdAt: string;
  student: {
    nis: string;
    name: string;
    parentName: string;
  };
  tuitions: {
    period: string;
    year: number;
    amount: string;
  }[];
  bankAccount: {
    id: string;
    bankName: string;
    accountNumber: string;
  } | null;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface TestTransferResponse {
  success: boolean;
  data: {
    paymentRequests: PaymentRequest[];
    bankAccounts: BankAccount[];
  };
}

export function useTestTransferData(status: string) {
  return useQuery({
    queryKey: queryKeys.testTransfer.list(status),
    queryFn: async () => {
      const { data } = await apiClient.get<TestTransferResponse>(
        "/admin/test-transfer",
        { params: { status } },
      );
      return data.data;
    },
  });
}

export function useSimulateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentRequestId,
      bankAccountId,
    }: {
      paymentRequestId: string;
      bankAccountId: string;
    }) => {
      const { data } = await apiClient.post<{ success: boolean }>(
        "/admin/test-transfer",
        { paymentRequestId, bankAccountId },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.testTransfer.all });
    },
  });
}
