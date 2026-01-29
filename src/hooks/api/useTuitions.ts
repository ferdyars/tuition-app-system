"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Month, PaymentStatus } from "@/generated/prisma/client";
import { apiClient } from "@/lib/api-client";
import { queryKeys, type TuitionFilters } from "@/lib/query-keys";

interface Tuition {
  id: string;
  classAcademicId: string;
  studentNis: string;
  month: Month;
  year: number;
  feeAmount: string;
  paidAmount: string;
  status: PaymentStatus;
  dueDate: string;
  generatedAt: string;
  createdAt: string;
  updatedAt?: string;
  student?: {
    nis: string;
    name: string;
    parentPhone?: string;
  };
  classAcademic?: {
    className: string;
    grade: number;
    section: string;
    academicYear?: {
      year: string;
    };
  };
  _count?: {
    payments: number;
  };
  scholarship?: {
    id: string;
    nominal: string;
    isFullScholarship: boolean;
  } | null;
}

interface TuitionListResponse {
  success: boolean;
  data: {
    tuitions: Tuition[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface TuitionResponse {
  success: boolean;
  data: Tuition;
}

interface GenerateResponse {
  success: boolean;
  data: {
    generated: number;
    skipped: number;
    details: {
      totalStudents: number;
      studentsWithFullYear: number;
      studentsWithPartialYear: number;
      className: string;
      academicYear: string;
    };
  };
}

interface GenerateBulkResponse {
  success: boolean;
  data: {
    totalGenerated: number;
    totalSkipped: number;
    results: Array<{
      classAcademicId: string;
      className: string;
      generated: number;
      skipped: number;
      error?: string;
    }>;
  };
}

export function useTuitions(filters: TuitionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.tuitions.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<TuitionListResponse>("/tuitions", {
        params: filters as Record<
          string,
          string | number | boolean | undefined
        >,
      });
      return data.data;
    },
  });
}

export function useTuition(id: string) {
  return useQuery({
    queryKey: queryKeys.tuitions.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<TuitionResponse>(`/tuitions/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useGenerateTuitions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      classAcademicId: string;
      feeAmount: number;
      studentNisList?: string[];
    }) => {
      const { data } = await apiClient.post<GenerateResponse>(
        "/tuitions/generate",
        params,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tuitions.lists(),
      });
    },
  });
}

export function useGenerateBulkTuitions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      classes: Array<{
        classAcademicId: string;
        feeAmount: number;
        studentNisList?: string[];
      }>;
    }) => {
      const { data } = await apiClient.post<GenerateBulkResponse>(
        "/tuitions/generate-bulk",
        params,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tuitions.lists(),
      });
    },
  });
}

export function useUpdateTuition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        feeAmount?: number;
        dueDate?: string;
        status?: PaymentStatus;
      };
    }) => {
      const { data } = await apiClient.put<TuitionResponse>(
        `/tuitions/${id}`,
        updates,
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tuitions.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tuitions.detail(variables.id),
      });
    },
  });
}

export function useDeleteTuition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/tuitions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tuitions.lists(),
      });
    },
  });
}
