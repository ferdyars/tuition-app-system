"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { useGetMe } from "@/hooks/api/useGetMe";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetMe();

  const login = async (email: string, password: string) => {
    const { data } = await apiClient.post<{
      success: boolean;
      error?: { message: string };
    }>("/auth/login", { email, password });

    if (data.success) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      router.push("/");
      return { success: true };
    }

    throw new Error(data.error?.message || "Login failed");
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      queryClient.setQueryData(queryKeys.auth.me(), null);
      queryClient.clear();
      useAuthStore.getState().clear();
      router.push("/login");
    }
  };

  return {
    user: user ?? null,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };
}
