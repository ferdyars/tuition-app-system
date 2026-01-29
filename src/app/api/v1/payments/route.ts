import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { requireAuth } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { processPayment } from "@/lib/business-logic/payment-processor";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "10");
  const studentNis = searchParams.get("studentNis") || undefined;
  const classAcademicId = searchParams.get("classAcademicId") || undefined;
  const employeeId = searchParams.get("employeeId") || undefined;
  const paymentDateFrom = searchParams.get("paymentDateFrom") || undefined;
  const paymentDateTo = searchParams.get("paymentDateTo") || undefined;

  const where: Prisma.PaymentWhereInput = {};

  if (employeeId) {
    where.employeeId = employeeId;
  }

  if (paymentDateFrom || paymentDateTo) {
    where.paymentDate = {};
    if (paymentDateFrom) {
      where.paymentDate.gte = new Date(paymentDateFrom);
    }
    if (paymentDateTo) {
      where.paymentDate.lte = new Date(paymentDateTo);
    }
  }

  if (studentNis || classAcademicId) {
    where.tuition = {};
    if (studentNis) {
      where.tuition.studentNis = studentNis;
    }
    if (classAcademicId) {
      where.tuition.classAcademicId = classAcademicId;
    }
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        tuition: {
          include: {
            student: {
              select: { nis: true, name: true },
            },
            classAcademic: {
              select: { className: true },
            },
          },
        },
        employee: {
          select: { employeeId: true, name: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { paymentDate: "desc" },
    }),
    prisma.payment.count({ where }),
  ]);

  return successResponse({
    payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { tuitionId, amount, notes } = body;

    if (!tuitionId || amount === undefined) {
      return errorResponse(
        "Tuition ID and amount are required",
        "VALIDATION_ERROR",
        400,
      );
    }

    if (amount <= 0) {
      return errorResponse(
        "Amount must be greater than 0",
        "VALIDATION_ERROR",
        400,
      );
    }

    // Check if tuition exists
    const tuition = await prisma.tuition.findUnique({
      where: { id: tuitionId },
      include: {
        student: { select: { name: true } },
        classAcademic: { select: { className: true } },
      },
    });

    if (!tuition) {
      return errorResponse("Tuition not found", "NOT_FOUND", 404);
    }

    if (tuition.status === "PAID") {
      return errorResponse(
        "Tuition is already fully paid",
        "VALIDATION_ERROR",
        400,
      );
    }

    // Process payment
    const result = await processPayment(
      {
        tuitionId,
        amount,
        employeeId: auth.employeeId,
        notes,
      },
      prisma,
    );

    // Get the created payment with relations
    const payment = await prisma.payment.findUnique({
      where: { id: result.paymentId },
      include: {
        tuition: {
          include: {
            student: { select: { nis: true, name: true } },
            classAcademic: { select: { className: true } },
          },
        },
        employee: { select: { name: true } },
      },
    });

    return successResponse(
      {
        payment,
        result: {
          previousStatus: result.previousStatus,
          newStatus: result.newStatus,
          previousPaidAmount: result.previousPaidAmount,
          newPaidAmount: result.newPaidAmount,
          remainingAmount: result.remainingAmount,
          feeAmount: result.feeAmount,
          scholarshipAmount: result.scholarshipAmount,
          discountAmount: result.discountAmount,
          effectiveFeeAmount: result.effectiveFeeAmount,
        },
      },
      201,
    );
  } catch (error) {
    console.error("Create payment error:", error);
    if (error instanceof Error) {
      return errorResponse(error.message, "VALIDATION_ERROR", 400);
    }
    return errorResponse("Failed to process payment", "SERVER_ERROR", 500);
  }
}
