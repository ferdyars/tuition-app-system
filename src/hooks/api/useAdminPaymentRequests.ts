"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

interface PaymentRequest {
  id: string;
  status: string;
  totalAmount: string;
  baseAmount: string;
  uniqueCode: number;
  expiresAt: string;
  verifiedAt: string | null;
  createdAt: string;
  student: {
    nis: string;
    name: string;
    parentName: string;
    parentPhone: string;
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

interface PaymentRequestsResponse {
  success: boolean;
  data: {
    paymentRequests: PaymentRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface PaymentRequestFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export function useAdminPaymentRequests(filters: PaymentRequestFilters = {}) {
  return useQuery({
    queryKey: queryKeys.adminPaymentRequests.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<PaymentRequestsResponse>(
        "/admin/payment-requests",
        {
          params: filters as Record<string, string | number | undefined>,
        },
      );
      return data.data;
    },
  });
}
