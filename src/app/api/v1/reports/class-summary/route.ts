import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { successResponse } from "@/lib/api-response";
import { getClassSummary } from "@/lib/business-logic/overdue-calculator";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const searchParams = request.nextUrl.searchParams;
  const academicYearId = searchParams.get("academicYearId") || undefined;

  const classSummaries = await getClassSummary({ academicYearId }, prisma);

  // Calculate overall totals
  const overallTotals = classSummaries.reduce(
    (acc, cls) => ({
      totalStudents: acc.totalStudents + cls.statistics.totalStudents,
      totalTuitions: acc.totalTuitions + cls.statistics.totalTuitions,
      paid: acc.paid + cls.statistics.paid,
      unpaid: acc.unpaid + cls.statistics.unpaid,
      partial: acc.partial + cls.statistics.partial,
      totalFees: acc.totalFees + cls.statistics.totalFees,
      totalPaid: acc.totalPaid + cls.statistics.totalPaid,
      totalOutstanding: acc.totalOutstanding + cls.statistics.totalOutstanding,
    }),
    {
      totalStudents: 0,
      totalTuitions: 0,
      paid: 0,
      unpaid: 0,
      partial: 0,
      totalFees: 0,
      totalPaid: 0,
      totalOutstanding: 0,
    }
  );

  return successResponse({
    classes: classSummaries,
    totals: overallTotals,
  });
}
