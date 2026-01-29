"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, type PaymentFilters } from "@/lib/query-keys";
import { apiClient } from "@/lib/api-client";
import type { PaymentStatus, Month } from "@/generated/prisma/client";

interface Payment {
  id: string;
  tuitionId: string;
  employeeId: string;
  amount: string;
  paymentDate: string;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  tuition?: {
    id: string;
    month: Month;
    year: number;
    feeAmount: string;
    paidAmount: string;
    status: PaymentStatus;
    student?: {
      nis: string;
      name: string;
    };
    classAcademic?: {
      className: string;
    };
  };
  employee?: {
    employeeId: string;
    name: string;
  };
}

interface PaymentListResponse {
  success: boolean;
  data: {
    payments: Payment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface PaymentResponse {
  success: boolean;
  data: {
    payment: Payment;
    result: {
      previousStatus: PaymentStatus;
      newStatus: PaymentStatus;
      previousPaidAmount: number;
      newPaidAmount: number;
      remainingAmount: number;
      feeAmount: number;
    };
  };
}

export function usePayments(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.payments.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<PaymentListResponse>("/payments", {
        params: filters as Record<string, string | number | boolean | undefined>,
      });
      return data.data;
    },
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: queryKeys.payments.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Payment }>(
        `/payments/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: {
      tuitionId: string;
      amount: number;
      notes?: string;
    }) => {
      const { data } = await apiClient.post<PaymentResponse>(
        "/payments",
        payment
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tuitions.lists(),
      });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/payments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tuitions.lists(),
      });
    },
  });
}
