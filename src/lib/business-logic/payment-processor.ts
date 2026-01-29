import type { PaymentStatus, PrismaClient } from "@/generated/prisma/client";

export interface PaymentParams {
  tuitionId: string;
  amount: number;
  employeeId: string;
  notes?: string;
}

export interface PaymentResult {
  paymentId: string;
  newStatus: PaymentStatus;
  previousStatus: PaymentStatus;
  previousPaidAmount: number;
  newPaidAmount: number;
  remainingAmount: number;
  feeAmount: number;
}

/**
 * Process payment and update tuition status
 */
export async function processPayment(
  params: PaymentParams,
  prisma: PrismaClient,
): Promise<PaymentResult> {
  const { tuitionId, amount, employeeId, notes } = params;

  // Get tuition
  const tuition = await prisma.tuition.findUnique({
    where: { id: tuitionId },
  });

  if (!tuition) {
    throw new Error("Tuition not found");
  }

  if (tuition.status === "PAID") {
    throw new Error("Tuition is already fully paid");
  }

  const feeAmount = Number(tuition.feeAmount);
  const previousPaidAmount = Number(tuition.paidAmount);
  const previousStatus = tuition.status;

  // Calculate new paid amount
  const newPaidAmount = previousPaidAmount + amount;

  // Determine new status
  let newStatus: PaymentStatus;
  if (newPaidAmount >= feeAmount) {
    newStatus = "PAID";
  } else if (newPaidAmount > 0) {
    newStatus = "PARTIAL";
  } else {
    newStatus = "UNPAID";
  }

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      tuitionId,
      employeeId,
      amount,
      notes: notes || null,
    },
  });

  // Update tuition
  await prisma.tuition.update({
    where: { id: tuitionId },
    data: {
      paidAmount: newPaidAmount,
      status: newStatus,
    },
  });

  return {
    paymentId: payment.id,
    newStatus,
    previousStatus,
    previousPaidAmount,
    newPaidAmount,
    remainingAmount: Math.max(feeAmount - newPaidAmount, 0),
    feeAmount,
  };
}

/**
 * Reverse/delete payment and update tuition status
 */
export async function reversePayment(
  paymentId: string,
  prisma: PrismaClient,
): Promise<{
  tuitionId: string;
  newStatus: PaymentStatus;
  newPaidAmount: number;
}> {
  // Get payment with tuition
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { tuition: true },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  const tuition = payment.tuition;
  const paymentAmount = Number(payment.amount);
  const currentPaidAmount = Number(tuition.paidAmount);
  const feeAmount = Number(tuition.feeAmount);

  // Calculate new paid amount
  const newPaidAmount = Math.max(currentPaidAmount - paymentAmount, 0);

  // Determine new status
  let newStatus: PaymentStatus;
  if (newPaidAmount >= feeAmount) {
    newStatus = "PAID";
  } else if (newPaidAmount > 0) {
    newStatus = "PARTIAL";
  } else {
    newStatus = "UNPAID";
  }

  // Update tuition
  await prisma.tuition.update({
    where: { id: tuition.id },
    data: {
      paidAmount: newPaidAmount,
      status: newStatus,
    },
  });

  // Delete payment
  await prisma.payment.delete({
    where: { id: paymentId },
  });

  return {
    tuitionId: tuition.id,
    newStatus,
    newPaidAmount,
  };
}

/**
 * Calculate payment summary for a tuition
 */
export function calculatePaymentSummary(
  feeAmount: number,
  paidAmount: number,
): {
  remaining: number;
  percentage: number;
  status: PaymentStatus;
} {
  const remaining = Math.max(feeAmount - paidAmount, 0);
  const percentage = feeAmount > 0 ? (paidAmount / feeAmount) * 100 : 0;

  let status: PaymentStatus;
  if (paidAmount >= feeAmount) {
    status = "PAID";
  } else if (paidAmount > 0) {
    status = "PARTIAL";
  } else {
    status = "UNPAID";
  }

  return {
    remaining,
    percentage: Math.min(percentage, 100),
    status,
  };
}
