/**
 * Test Transfer API - Simulate bank transfer for testing
 * This endpoint allows admins to simulate a bank transfer being received
 * and trigger the payment verification process.
 *
 * Only available in development/testing environments.
 */

import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  // Only allow ADMIN role
  if (auth.role !== "ADMIN") {
    return errorResponse("Forbidden", "FORBIDDEN", 403);
  }

  try {
    const body = await request.json();
    const { paymentRequestId, bankAccountId } = body;

    if (!paymentRequestId) {
      return errorResponse(
        "paymentRequestId wajib diisi",
        "VALIDATION_ERROR",
        400,
      );
    }

    // Find the payment request
    const paymentRequest = await prisma.paymentRequest.findUnique({
      where: { id: paymentRequestId },
      include: {
        student: true,
        tuitions: {
          include: { tuition: true },
        },
      },
    });

    if (!paymentRequest) {
      return errorResponse("Payment request tidak ditemukan", "NOT_FOUND", 404);
    }

    if (paymentRequest.status !== "PENDING") {
      return errorResponse(
        `Payment request sudah ${paymentRequest.status}`,
        "INVALID_STATUS",
        400,
      );
    }

    // Check if expired
    if (new Date() > paymentRequest.expiresAt) {
      // Update status to expired
      await prisma.paymentRequest.update({
        where: { id: paymentRequestId },
        data: { status: "EXPIRED" },
      });
      return errorResponse("Payment request sudah kadaluarsa", "EXPIRED", 400);
    }

    // Get bank account (use provided or get first active one)
    let bankAccount;
    if (bankAccountId) {
      bankAccount = await prisma.schoolBankAccount.findUnique({
        where: { id: bankAccountId },
      });
    } else {
      bankAccount = await prisma.schoolBankAccount.findFirst({
        where: { isActive: true },
      });
    }

    if (!bankAccount) {
      return errorResponse("Bank account tidak ditemukan", "NOT_FOUND", 404);
    }

    // Simulate successful transfer verification
    // Update payment request to VERIFIED
    const updatedPayment = await prisma.$transaction(async (tx) => {
      // Update payment request
      const payment = await tx.paymentRequest.update({
        where: { id: paymentRequestId },
        data: {
          status: "VERIFIED",
          verifiedAt: new Date(),
          bankAccountId: bankAccount.id,
        },
      });

      // Update all tuitions in this payment request
      for (const pt of paymentRequest.tuitions) {
        const tuition = pt.tuition;
        const newPaidAmount = tuition.paidAmount.plus(pt.amount);
        const totalDue = tuition.feeAmount
          .minus(tuition.scholarshipAmount)
          .minus(tuition.discountAmount);

        const newStatus = newPaidAmount.gte(totalDue) ? "PAID" : "PARTIAL";

        await tx.tuition.update({
          where: { id: tuition.id },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
          },
        });
      }

      // Create payment records for each tuition
      for (const pt of paymentRequest.tuitions) {
        await tx.payment.create({
          data: {
            tuitionId: pt.tuition.id,
            employeeId: auth.employeeId,
            amount: pt.amount,
            notes: `Test transfer - Payment Request: ${paymentRequestId}`,
          },
        });
      }

      return payment;
    });

    return successResponse({
      message: "Transfer berhasil disimulasikan",
      paymentRequest: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        verifiedAt: updatedPayment.verifiedAt,
        totalAmount: updatedPayment.totalAmount.toString(),
        bankAccount: {
          id: bankAccount.id,
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber,
        },
      },
    });
  } catch (error) {
    console.error("Test transfer error:", error);
    return errorResponse("Terjadi kesalahan", "INTERNAL_ERROR", 500);
  }
}

// GET: List pending payment requests for testing
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  if (auth.role !== "ADMIN") {
    return errorResponse("Forbidden", "FORBIDDEN", 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";

    const paymentRequests = await prisma.paymentRequest.findMany({
      where: {
        status: status as "PENDING" | "VERIFIED" | "EXPIRED" | "CANCELLED",
      },
      include: {
        student: {
          select: {
            nis: true,
            name: true,
            parentName: true,
          },
        },
        tuitions: {
          include: {
            tuition: {
              select: {
                period: true,
                year: true,
              },
            },
          },
        },
        bankAccount: {
          select: {
            id: true,
            bankName: true,
            accountNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const bankAccounts = await prisma.schoolBankAccount.findMany({
      where: { isActive: true },
      select: {
        id: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
      },
    });

    return successResponse({
      paymentRequests: paymentRequests.map((pr) => ({
        id: pr.id,
        status: pr.status,
        totalAmount: pr.totalAmount.toString(),
        baseAmount: pr.baseAmount.toString(),
        uniqueCode: pr.uniqueCode,
        expiresAt: pr.expiresAt.toISOString(),
        createdAt: pr.createdAt.toISOString(),
        student: pr.student,
        tuitions: pr.tuitions.map((t) => ({
          period: t.tuition.period,
          year: t.tuition.year,
          amount: t.amount.toString(),
        })),
        bankAccount: pr.bankAccount,
      })),
      bankAccounts,
    });
  } catch (error) {
    console.error("Get pending payments error:", error);
    return errorResponse("Terjadi kesalahan", "INTERNAL_ERROR", 500);
  }
}
