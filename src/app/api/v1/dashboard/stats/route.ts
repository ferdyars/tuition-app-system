import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { successResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  // Get active academic year
  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  });

  // Total students
  const totalStudents = await prisma.student.count();

  // Total employees
  const totalEmployees = await prisma.employee.count();

  // Get current month payments
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const monthlyPayments = await prisma.payment.aggregate({
    _sum: { amount: true },
    _count: true,
    where: {
      paymentDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  // Get overdue tuitions count
  const overdueTuitions = await prisma.tuition.count({
    where: {
      status: { in: ["UNPAID", "PARTIAL"] },
      dueDate: { lt: now },
      ...(activeYear ? { classAcademic: { academicYearId: activeYear.id } } : {}),
    },
  });

  // Get total outstanding amount
  const outstandingData = await prisma.tuition.aggregate({
    _sum: { feeAmount: true, paidAmount: true },
    where: {
      status: { in: ["UNPAID", "PARTIAL"] },
      ...(activeYear ? { classAcademic: { academicYearId: activeYear.id } } : {}),
    },
  });

  const totalOutstanding =
    Number(outstandingData._sum.feeAmount || 0) -
    Number(outstandingData._sum.paidAmount || 0);

  // Get tuition stats for active year
  const tuitionStats = activeYear
    ? await prisma.tuition.groupBy({
        by: ["status"],
        _count: true,
        where: { classAcademic: { academicYearId: activeYear.id } },
      })
    : [];

  const paidCount = tuitionStats.find((s) => s.status === "PAID")?._count || 0;
  const unpaidCount = tuitionStats.find((s) => s.status === "UNPAID")?._count || 0;
  const partialCount = tuitionStats.find((s) => s.status === "PARTIAL")?._count || 0;

  // Get recent payments
  const recentPayments = await prisma.payment.findMany({
    take: 5,
    orderBy: { paymentDate: "desc" },
    include: {
      tuition: {
        include: {
          student: { select: { name: true, nis: true } },
          classAcademic: { select: { className: true } },
        },
      },
      employee: { select: { name: true } },
    },
  });

  return successResponse({
    totalStudents,
    totalEmployees,
    activeAcademicYear: activeYear?.year || null,
    monthlyRevenue: Number(monthlyPayments._sum.amount || 0),
    monthlyPaymentsCount: monthlyPayments._count,
    overdueTuitions,
    totalOutstanding,
    tuitionStats: {
      paid: paidCount,
      unpaid: unpaidCount,
      partial: partialCount,
      total: paidCount + unpaidCount + partialCount,
    },
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      paymentDate: p.paymentDate,
      studentName: p.tuition.student.name,
      studentNis: p.tuition.student.nis,
      className: p.tuition.classAcademic.className,
      processedBy: p.employee.name,
    })),
  });
}
