"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/store/auth-store";

interface User {
  employeeId: string;
  name: string;
  email: string;
  role: "ADMIN" | "CASHIER";
}

export function useGetMe() {
  const { setUser } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async (): Promise<User | null> => {
      const response = await fetch("/api/v1/auth/me", {
        credentials: "include",
      });

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const data = await response.json();
      const user = data.success ? data.data : null;
      setUser(user);
      return user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    placeholderData: () => useAuthStore.getState().user,
  });
}
