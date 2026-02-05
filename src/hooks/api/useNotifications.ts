"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { type NotificationFilters, queryKeys } from "@/lib/query-keys";

interface NotificationLog {
  id: string;
  phone: string;
  messageType: string;
  message: string;
  status: "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  messageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  success: boolean;
  data: {
    logs: NotificationLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export function useNotificationLogs(filters: NotificationFilters = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<NotificationsResponse>(
        "/admin/notifications",
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

export function useResendNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logId: string) => {
      const { data } = await apiClient.post<{
        success: boolean;
        data: { whatsappLink: string; logId: string };
      }>("/admin/notifications", { action: "resend", logId });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
