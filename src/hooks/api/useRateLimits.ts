"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys, type RateLimitFilters } from "@/lib/query-keys";

interface RateLimitRecord {
  id: string;
  key: string;
  action: string;
  identifier: string;
  count: number;
  windowStart: string;
  expiresAt: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

interface RateLimitsResponse {
  success: boolean;
  data: {
    records: RateLimitRecord[];
  };
}

export function useRateLimits(filters: RateLimitFilters = {}) {
  return useQuery({
    queryKey: queryKeys.rateLimits.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<RateLimitsResponse>(
        "/admin/rate-limits",
        {
          params: filters as Record<
            string,
            string | number | boolean | undefined
          >,
        },
      );
      return data.data.records;
    },
  });
}

export function useResetRateLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      identifier,
    }: {
      action: string;
      identifier: string;
    }) => {
      await apiClient.post("/admin/rate-limits", { action, identifier });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rateLimits.all });
    },
  });
}
