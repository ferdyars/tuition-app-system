import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  employeeId: string;
  name: string;
  email: string;
  role: "ADMIN" | "CASHIER";
}

interface AuthState {
  user: User | null;
  _hasHydrated: boolean;
  setUser: (user: User | null) => void;
  clear: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      _hasHydrated: false,
      setUser: (user) => set({ user }),
      clear: () => set({ user: null }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

// Hook to safely use the store after hydration
export function useAuthStoreHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Wait for zustand to hydrate from localStorage
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Check if already hydrated
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  return hydrated;
}
