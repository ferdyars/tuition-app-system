"use client";

import { useQuery } from "@tanstack/react-query";
import type { Month } from "@/generated/prisma/client";
import { apiClient } from "@/lib/api-client";
import {
  type ClassSummaryFilters,
  type OverdueFilters,
  queryKeys,
} from "@/lib/query-keys";

interface OverdueMonth {
  tuitionId: string;
  month: Month;
  year: number;
  feeAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  dueDate: string;
  daysOverdue: number;
}

interface OverdueByStudent {
  student: {
    nis: string;
    name: string;
    parentName: string;
    parentPhone: string;
  };
  class: {
    className: string;
    grade: number;
    section: string;
  };
  overdueMonths: OverdueMonth[];
  totalOverdue: number;
  overdueCount: number;
}

interface OverdueSummary {
  totalStudents: number;
  totalOverdueAmount: number;
  totalOverdueRecords: number;
}

interface OverdueReportResponse {
  success: boolean;
  data: {
    overdue: OverdueByStudent[];
    summary: OverdueSummary;
  };
}

interface ClassSummaryItem {
  class: {
    id: string;
    className: string;
    grade: number;
    section: string;
  };
  statistics: {
    totalStudents: number;
    totalTuitions: number;
    paid: number;
    unpaid: number;
    partial: number;
    totalFees: number;
    totalPaid: number;
    totalOutstanding: number;
  };
}

interface ClassSummaryResponse {
  success: boolean;
  data: {
    classes: ClassSummaryItem[];
    totals: {
      totalStudents: number;
      totalTuitions: number;
      paid: number;
      unpaid: number;
      partial: number;
      totalFees: number;
      totalPaid: number;
      totalOutstanding: number;
    };
  };
}

export function useOverdueReport(filters: OverdueFilters = {}) {
  return useQuery({
    queryKey: queryKeys.reports.overdue(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<OverdueReportResponse>(
        "/reports/overdue",
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

export function useClassSummary(filters: ClassSummaryFilters = {}) {
  return useQuery({
    queryKey: queryKeys.reports.classSummary(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<ClassSummaryResponse>(
        "/reports/class-summary",
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

export function useExportOverdueReport() {
  const exportReport = async (filters: OverdueFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.classAcademicId) {
      params.set("classAcademicId", filters.classAcademicId);
    }
    if (filters.grade) {
      params.set("grade", String(filters.grade));
    }
    if (filters.academicYearId) {
      params.set("academicYearId", filters.academicYearId);
    }

    const url = `/api/v1/reports/overdue/export?${params.toString()}`;
    window.open(url, "_blank");
  };

  return { exportReport };
}
