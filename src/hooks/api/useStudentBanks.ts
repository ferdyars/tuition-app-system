"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { studentApiClient } from "@/lib/student-api-client";

interface BankAccount {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  logoUrl: string | null;
}

interface BanksResponse {
  success: boolean;
  data: {
    banks: BankAccount[];
  };
}

export function useStudentBanks() {
  return useQuery({
    queryKey: queryKeys.studentBanks.list(),
    queryFn: async () => {
      const { data } =
        await studentApiClient.get<BanksResponse>("/student/banks");
      return data.data.banks;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - banks don't change often
  });
}
