import { PrismaClient } from "@/generated/prisma/client";

export interface ScholarshipApplicationParams {
  studentNis: string;
  classAcademicId: string;
  nominal: number;
  monthlyFee: number;
}

export interface ScholarshipApplicationResult {
  isFullScholarship: boolean;
  tuitionsAffected: number;
  autoPayments: Array<{
    tuitionId: string;
    amount: number;
  }>;
}

/**
 * Apply scholarship and auto-pay tuitions if full scholarship
 */
export async function applyScholarship(
  params: ScholarshipApplicationParams,
  prisma: PrismaClient,
  systemEmployeeId: string
): Promise<ScholarshipApplicationResult> {
  const { studentNis, classAcademicId, nominal, monthlyFee } = params;

  // Determine if full scholarship (covers full monthly fee)
  const isFullScholarship = nominal >= monthlyFee;

  const result: ScholarshipApplicationResult = {
    isFullScholarship,
    tuitionsAffected: 0,
    autoPayments: [],
  };

  if (isFullScholarship) {
    // Find all unpaid tuitions for this student in this class
    const unpaidTuitions = await prisma.tuition.findMany({
      where: {
        studentNis,
        classAcademicId,
        status: "UNPAID",
      },
    });

    // Create auto-payments for all unpaid tuitions
    for (const tuition of unpaidTuitions) {
      const feeAmount = Number(tuition.feeAmount);

      // Update tuition to PAID
      await prisma.tuition.update({
        where: { id: tuition.id },
        data: {
          status: "PAID",
          paidAmount: feeAmount,
        },
      });

      // Create system payment record
      await prisma.payment.create({
        data: {
          tuitionId: tuition.id,
          employeeId: systemEmployeeId,
          amount: feeAmount,
          notes: `Auto-paid via full scholarship (Rp ${nominal.toLocaleString("id-ID")})`,
        },
      });

      result.autoPayments.push({
        tuitionId: tuition.id,
        amount: feeAmount,
      });
    }

    result.tuitionsAffected = unpaidTuitions.length;
  }

  return result;
}

/**
 * Calculate scholarship coverage percentage
 */
export function calculateScholarshipCoverage(
  scholarshipAmount: number,
  monthlyFee: number
): {
  percentage: number;
  isFullScholarship: boolean;
  remainingAmount: number;
} {
  const percentage = Math.min((scholarshipAmount / monthlyFee) * 100, 100);
  const isFullScholarship = percentage >= 100;
  const remainingAmount = Math.max(monthlyFee - scholarshipAmount, 0);

  return {
    percentage,
    isFullScholarship,
    remainingAmount,
  };
}

/**
 * Get the fee amount for a class (from existing tuitions or default)
 */
export async function getClassFeeAmount(
  classAcademicId: string,
  prisma: PrismaClient
): Promise<number | null> {
  const tuition = await prisma.tuition.findFirst({
    where: { classAcademicId },
    select: { feeAmount: true },
  });

  return tuition ? Number(tuition.feeAmount) : null;
}
