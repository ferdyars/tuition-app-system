import type { PaymentRequestStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getAvailableUniqueAmount } from "./unique-amount-generator";

const EXPIRATION_MINUTES = 10; // Backend expiration (frontend shows 5 min)

// ============================================
// CREATE PAYMENT REQUEST (Multiple Tuitions)
// ============================================

interface CreatePaymentRequestInput {
  studentNis: string;
  tuitionIds: string[];
  idempotencyKey: string;
}

export async function createPaymentRequest(input: CreatePaymentRequestInput) {
  const { studentNis, tuitionIds, idempotencyKey } = input;

  if (tuitionIds.length === 0) {
    throw new Error("Pilih minimal satu tagihan");
  }

  // Check for existing request with same idempotency key
  const existingByKey = await prisma.paymentRequest.findUnique({
    where: { idempotencyKey },
    include: {
      tuitions: {
        include: {
          tuition: {
            include: {
              classAcademic: {
                select: {
                  className: true,
                  academicYear: { select: { year: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (existingByKey) {
    // Return cached response
    return formatPaymentRequestResponse(existingByKey);
  }

  // Check if student has any active PENDING payment request
  const existingPending = await prisma.paymentRequest.findFirst({
    where: {
      studentNis,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    include: {
      tuitions: {
        include: {
          tuition: {
            include: {
              classAcademic: {
                select: {
                  className: true,
                  academicYear: { select: { year: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (existingPending) {
    throw new Error(
      "Anda masih memiliki transaksi yang sedang berjalan. Selesaikan atau batalkan terlebih dahulu.",
    );
  }

  // Validate all tuitions
  const tuitions = await prisma.tuition.findMany({
    where: {
      id: { in: tuitionIds },
      studentNis,
      status: { not: "PAID" },
    },
    include: {
      classAcademic: {
        select: {
          className: true,
          academicYear: { select: { year: true } },
        },
      },
    },
  });

  if (tuitions.length !== tuitionIds.length) {
    throw new Error("Beberapa tagihan tidak ditemukan atau sudah lunas");
  }

  // Calculate total base amount (sum of remaining amounts)
  let totalBaseAmount = 0;
  const tuitionAmounts: { tuitionId: string; amount: number }[] = [];

  for (const tuition of tuitions) {
    const remainingAmount =
      Number(tuition.feeAmount) -
      Number(tuition.paidAmount) -
      Number(tuition.scholarshipAmount) -
      Number(tuition.discountAmount);

    if (remainingAmount <= 0) {
      throw new Error(`Tagihan ${tuition.period} ${tuition.year} sudah lunas`);
    }

    totalBaseAmount += remainingAmount;
    tuitionAmounts.push({ tuitionId: tuition.id, amount: remainingAmount });
  }

  // Generate unique amount
  const { uniqueCode, totalAmount } =
    await getAvailableUniqueAmount(totalBaseAmount);

  // Calculate expiration
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + EXPIRATION_MINUTES);

  // Create payment request with tuitions
  const paymentRequest = await prisma.paymentRequest.create({
    data: {
      student: { connect: { nis: studentNis } },
      baseAmount: totalBaseAmount,
      uniqueCode,
      totalAmount,
      idempotencyKey,
      expiresAt,
      status: "PENDING",
      tuitions: {
        create: tuitionAmounts.map((ta) => ({
          tuition: { connect: { id: ta.tuitionId } },
          amount: ta.amount,
        })),
      },
    },
    include: {
      tuitions: {
        include: {
          tuition: {
            include: {
              classAcademic: {
                select: {
                  className: true,
                  academicYear: { select: { year: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  return formatPaymentRequestResponse(paymentRequest);
}

// ============================================
// GET PAYMENT REQUEST
// ============================================

export async function getPaymentRequest(id: string, studentNis?: string) {
  const request = await prisma.paymentRequest.findUnique({
    where: { id },
    include: {
      student: {
        select: {
          nis: true,
          name: true,
          parentName: true,
          parentPhone: true,
        },
      },
      tuitions: {
        include: {
          tuition: {
            select: {
              id: true,
              period: true,
              year: true,
              feeAmount: true,
              paidAmount: true,
              scholarshipAmount: true,
              discountAmount: true,
              status: true,
              classAcademic: {
                select: {
                  className: true,
                  academicYear: {
                    select: { year: true },
                  },
                },
              },
            },
          },
        },
      },
      bankAccount: {
        select: {
          id: true,
          bankName: true,
          accountNumber: true,
          accountName: true,
          logoUrl: true,
        },
      },
    },
  });

  if (!request) {
    throw new Error("Payment request tidak ditemukan");
  }

  // If studentNis provided, verify ownership
  if (studentNis && request.studentNis !== studentNis) {
    throw new Error("Tidak memiliki akses ke payment request ini");
  }

  return {
    id: request.id,
    baseAmount: request.baseAmount,
    uniqueCode: request.uniqueCode,
    totalAmount: request.totalAmount,
    status: request.status,
    expiresAt: request.expiresAt,
    verifiedAt: request.verifiedAt,
    createdAt: request.createdAt,
    student: request.student,
    tuitions: request.tuitions.map((t) => ({
      id: t.tuition.id,
      period: t.tuition.period,
      year: t.tuition.year,
      feeAmount: t.tuition.feeAmount,
      paidAmount: t.tuition.paidAmount,
      scholarshipAmount: t.tuition.scholarshipAmount,
      discountAmount: t.tuition.discountAmount,
      status: t.tuition.status,
      amount: t.amount,
      className: t.tuition.classAcademic.className,
      academicYear: t.tuition.classAcademic.academicYear.year,
    })),
    bankAccount: request.bankAccount,
  };
}

// ============================================
// GET ACTIVE PAYMENT REQUEST FOR STUDENT
// ============================================

export async function getActivePaymentRequest(studentNis: string) {
  const request = await prisma.paymentRequest.findFirst({
    where: {
      studentNis,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    include: {
      tuitions: {
        include: {
          tuition: {
            include: {
              classAcademic: {
                select: {
                  className: true,
                  academicYear: { select: { year: true } },
                },
              },
            },
          },
        },
      },
      bankAccount: true,
    },
  });

  if (!request) {
    return null;
  }

  return formatPaymentRequestResponse(request);
}

// ============================================
// LIST PAYMENT REQUESTS (Student)
// ============================================

interface ListPaymentRequestsOptions {
  studentNis: string;
  status?: PaymentRequestStatus;
  page?: number;
  limit?: number;
}

export async function listPaymentRequests(options: ListPaymentRequestsOptions) {
  const { studentNis, status, page = 1, limit = 10 } = options;

  const where = {
    studentNis,
    ...(status ? { status } : {}),
  };

  const [requests, total] = await Promise.all([
    prisma.paymentRequest.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        tuitions: {
          include: {
            tuition: {
              select: {
                period: true,
                year: true,
                status: true,
                classAcademic: {
                  select: {
                    className: true,
                    academicYear: { select: { year: true } },
                  },
                },
              },
            },
          },
        },
        bankAccount: {
          select: {
            bankName: true,
            accountNumber: true,
          },
        },
      },
    }),
    prisma.paymentRequest.count({ where }),
  ]);

  return {
    requests: requests.map((r) => ({
      id: r.id,
      baseAmount: r.baseAmount,
      uniqueCode: r.uniqueCode,
      totalAmount: r.totalAmount,
      status: r.status,
      expiresAt: r.expiresAt,
      verifiedAt: r.verifiedAt,
      createdAt: r.createdAt,
      tuitions: r.tuitions.map((t) => ({
        period: t.tuition.period,
        year: t.tuition.year,
        status: t.tuition.status,
        className: t.tuition.classAcademic.className,
        academicYear: t.tuition.classAcademic.academicYear.year,
      })),
      bankAccount: r.bankAccount,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================
// CANCEL PAYMENT REQUEST
// ============================================

export async function cancelPaymentRequest(id: string, studentNis: string) {
  const request = await prisma.paymentRequest.findUnique({
    where: { id },
  });

  if (!request) {
    throw new Error("Payment request tidak ditemukan");
  }

  if (request.studentNis !== studentNis) {
    throw new Error("Tidak memiliki akses ke payment request ini");
  }

  if (request.status !== "PENDING") {
    throw new Error(
      "Hanya dapat membatalkan payment request yang masih PENDING",
    );
  }

  await prisma.paymentRequest.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return { success: true, message: "Payment request berhasil dibatalkan" };
}

// ============================================
// GET UNPAID TUITIONS FOR STUDENT
// ============================================

export async function getUnpaidTuitions(studentNis: string) {
  return prisma.tuition.findMany({
    where: {
      studentNis,
      status: { not: "PAID" },
    },
    orderBy: [{ year: "asc" }, { period: "asc" }],
    select: {
      id: true,
      period: true,
      year: true,
      feeAmount: true,
      paidAmount: true,
      scholarshipAmount: true,
      discountAmount: true,
      status: true,
      dueDate: true,
      classAcademic: {
        select: {
          className: true,
          academicYear: { select: { year: true } },
        },
      },
    },
  });
}

// ============================================
// EXPIRE PENDING PAYMENTS (Cron Job)
// ============================================

export async function expirePendingPayments() {
  const result = await prisma.paymentRequest.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: new Date() },
    },
    data: {
      status: "EXPIRED",
    },
  });

  return result.count;
}

// ============================================
// VERIFY PAYMENT (Called by IMAP matcher)
// ============================================

interface VerifyPaymentInput {
  paymentRequestId: string;
  bankAccountId: string;
  emailMatchId: string;
}

export async function verifyPayment(input: VerifyPaymentInput) {
  const { paymentRequestId, bankAccountId, emailMatchId } = input;

  const request = await prisma.paymentRequest.findUnique({
    where: { id: paymentRequestId },
    include: {
      tuitions: {
        include: { tuition: true },
      },
    },
  });

  if (!request) {
    throw new Error("Payment request tidak ditemukan");
  }

  if (request.status !== "PENDING") {
    throw new Error("Payment request tidak dalam status PENDING");
  }

  // Update payment request with bank info and verify
  const updated = await prisma.paymentRequest.update({
    where: { id: paymentRequestId },
    data: {
      bankAccountId,
      emailMatchId,
      status: "VERIFIED",
      verifiedAt: new Date(),
    },
  });

  // Update all tuitions in this payment request
  for (const pt of request.tuitions) {
    const tuition = pt.tuition;
    const paymentAmount = Number(pt.amount);

    const newPaidAmount = Number(tuition.paidAmount) + paymentAmount;
    const totalDue =
      Number(tuition.feeAmount) -
      Number(tuition.scholarshipAmount) -
      Number(tuition.discountAmount);

    await prisma.tuition.update({
      where: { id: tuition.id },
      data: {
        paidAmount: newPaidAmount,
        status: newPaidAmount >= totalDue ? "PAID" : "PARTIAL",
      },
    });
  }

  return updated;
}

// ============================================
// HELPER: Format Payment Request Response
// ============================================

function formatPaymentRequestResponse(request: {
  id: string;
  baseAmount: unknown;
  uniqueCode: number;
  totalAmount: unknown;
  status: PaymentRequestStatus;
  expiresAt: Date;
  tuitions: Array<{
    amount: unknown;
    tuition: {
      id: string;
      period: string;
      year: number;
      classAcademic: {
        className: string;
        academicYear: { year: string };
      };
    };
  }>;
}) {
  return {
    id: request.id,
    baseAmount: request.baseAmount,
    uniqueCode: request.uniqueCode,
    totalAmount: request.totalAmount,
    expiresAt: request.expiresAt,
    status: request.status,
    tuitions: request.tuitions.map((t) => ({
      id: t.tuition.id,
      period: t.tuition.period,
      year: t.tuition.year,
      amount: t.amount,
      className: t.tuition.classAcademic.className,
      academicYear: t.tuition.classAcademic.academicYear.year,
    })),
  };
}
