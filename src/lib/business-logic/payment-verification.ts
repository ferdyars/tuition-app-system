import { prisma } from "@/lib/prisma";
import { parseBankEmail } from "./bank-email-parser";

interface IMAPConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
  mailbox: string;
}

export function getIMAPConfig(): IMAPConfig {
  return {
    host: process.env.IMAP_HOST || "imap.gmail.com",
    port: Number.parseInt(process.env.IMAP_PORT || "993", 10),
    user: process.env.IMAP_USER || "",
    password: process.env.IMAP_PASSWORD || "",
    tls: true,
    mailbox: process.env.IMAP_MAILBOX || "INBOX",
  };
}

// ============================================
// PROCESS BANK EMAIL (Called by IMAP poller or webhook)
// ============================================

interface ProcessEmailInput {
  emailUid: string;
  fromAddress: string;
  subject: string;
  body: string;
  receivedAt: Date;
}

export async function processBankEmail(input: ProcessEmailInput) {
  const { emailUid, fromAddress, subject, body, receivedAt } = input;

  // Check if already processed
  const existing = await prisma.bankEmailLog.findUnique({
    where: { emailUid },
  });

  if (existing) {
    return { alreadyProcessed: true };
  }

  // Parse bank email
  const parsed = parseBankEmail(fromAddress, subject, body);
  if (!parsed.amount || !parsed.bankCode) {
    // Log unparseable email
    await prisma.bankEmailLog.create({
      data: {
        emailUid,
        receivedAt,
        fromAddress,
        subject,
        amount: null,
        rawContent: body.substring(0, 5000),
        isMatched: false,
      },
    });
    return { parsed: false };
  }

  // Find matching school bank account
  const bankAccount = await prisma.schoolBankAccount.findFirst({
    where: {
      bankCode: parsed.bankCode,
      isActive: true,
    },
  });

  if (!bankAccount) {
    // Log but don't match
    await prisma.bankEmailLog.create({
      data: {
        emailUid,
        receivedAt,
        fromAddress,
        subject,
        amount: parsed.amount,
        senderName: parsed.senderName,
        senderAccount: parsed.senderAccount,
        rawContent: body.substring(0, 5000),
        isMatched: false,
      },
    });
    return { noBankAccount: true };
  }

  // Log to database
  const emailLog = await prisma.bankEmailLog.create({
    data: {
      emailUid,
      receivedAt,
      fromAddress,
      subject,
      amount: parsed.amount,
      senderName: parsed.senderName,
      senderAccount: parsed.senderAccount,
      bankAccountId: bankAccount.id,
      rawContent: body.substring(0, 5000),
      isMatched: false,
    },
  });

  // Try to match with pending payment for this bank
  const matchedRequest = await prisma.paymentRequest.findFirst({
    where: {
      bankAccountId: bankAccount.id,
      totalAmount: parsed.amount,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "asc" }, // FIFO
  });

  if (matchedRequest) {
    await verifyPayment(matchedRequest.id, emailLog.id);
    return { matched: true, requestId: matchedRequest.id };
  }

  return { matched: false };
}

// ============================================
// VERIFY PAYMENT
// ============================================

export async function verifyPayment(requestId: string, emailLogId: string) {
  await prisma.$transaction(async (tx) => {
    // Update payment request
    const request = await tx.paymentRequest.update({
      where: { id: requestId },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
        emailMatchId: emailLogId,
      },
      include: {
        tuitions: {
          include: { tuition: true },
        },
        student: true,
      },
    });

    // Update all tuitions in this payment request
    for (const pt of request.tuitions) {
      const tuition = pt.tuition;
      const paymentAmount = Number(pt.amount);

      const newPaidAmount = Number(tuition.paidAmount) + paymentAmount;
      const totalFee =
        Number(tuition.feeAmount) -
        Number(tuition.scholarshipAmount) -
        Number(tuition.discountAmount);

      const newStatus = newPaidAmount >= totalFee ? "PAID" : "PARTIAL";

      await tx.tuition.update({
        where: { id: tuition.id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
      });

      // Create payment record for each tuition
      await tx.payment.create({
        data: {
          tuitionId: tuition.id,
          employeeId: "SYSTEM", // Note: You may need to create a SYSTEM employee
          amount: paymentAmount,
          notes: `Bank transfer verified via IMAP. Request: ${requestId}`,
        },
      });
    }

    // Update student's last payment date (for account cleanup)
    await tx.student.update({
      where: { nis: request.studentNis },
      data: { lastPaymentAt: new Date() },
    });

    // Mark email as matched
    await tx.bankEmailLog.update({
      where: { id: emailLogId },
      data: {
        isMatched: true,
        matchedRequestId: requestId,
      },
    });
  });

  // TODO: Send notification to student (WhatsApp/Email)
  console.log(`Payment verified for request: ${requestId}`);
}

// ============================================
// MANUAL VERIFICATION (Admin)
// ============================================

export async function manualVerifyPayment(
  requestId: string,
  verifiedBy: string,
) {
  const request = await prisma.paymentRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error("Payment request tidak ditemukan");
  }

  if (request.status !== "PENDING") {
    throw new Error("Payment request sudah diproses");
  }

  await prisma.$transaction(async (tx) => {
    // Update payment request
    const updatedRequest = await tx.paymentRequest.update({
      where: { id: requestId },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
      include: {
        tuitions: {
          include: { tuition: true },
        },
      },
    });

    // Update all tuitions in this payment request
    for (const pt of updatedRequest.tuitions) {
      const tuition = pt.tuition;
      const paymentAmount = Number(pt.amount);

      const newPaidAmount = Number(tuition.paidAmount) + paymentAmount;
      const totalFee =
        Number(tuition.feeAmount) -
        Number(tuition.scholarshipAmount) -
        Number(tuition.discountAmount);

      const newStatus = newPaidAmount >= totalFee ? "PAID" : "PARTIAL";

      await tx.tuition.update({
        where: { id: tuition.id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
      });

      // Create payment record for each tuition
      await tx.payment.create({
        data: {
          tuitionId: tuition.id,
          employeeId: verifiedBy,
          amount: paymentAmount,
          notes: `Bank transfer manually verified. Request: ${requestId}`,
        },
      });
    }

    // Update student's last payment date
    await tx.student.update({
      where: { nis: updatedRequest.studentNis },
      data: { lastPaymentAt: new Date() },
    });
  });

  return { success: true, message: "Payment berhasil diverifikasi" };
}

// ============================================
// GET UNMATCHED EMAILS (Admin)
// ============================================

export async function getUnmatchedEmails(page = 1, limit = 20) {
  const where = {
    isMatched: false,
    amount: { not: null },
  };

  const [emails, total] = await Promise.all([
    prisma.bankEmailLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { receivedAt: "desc" },
      include: {
        bankAccount: {
          select: {
            bankName: true,
            accountNumber: true,
          },
        },
      },
    }),
    prisma.bankEmailLog.count({ where }),
  ]);

  return {
    emails,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
