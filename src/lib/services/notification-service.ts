/**
 * Notification Service
 * Handles WhatsApp notifications for payment events
 * Uses manual WhatsApp links (click-to-chat)
 */

import { prisma } from "@/lib/prisma";
import {
  generatePaymentReminderLink,
  generatePaymentRequestLink,
  generatePaymentVerifiedLink,
} from "./whatsapp-link";

type MessageType = "PAYMENT_VERIFIED" | "PAYMENT_REMINDER" | "PAYMENT_REQUEST";

interface NotificationResult {
  success: boolean;
  whatsappLink: string;
  logId: string;
}

/**
 * Create notification log and generate WhatsApp link
 * Manual approach: admin/user clicks link to send via WhatsApp
 */
async function createNotificationLog(
  phone: string,
  messageType: MessageType,
  message: string,
  whatsappLink: string,
): Promise<NotificationResult> {
  const log = await prisma.whatsAppLog.create({
    data: {
      phone,
      messageType,
      message,
      status: "PENDING",
    },
  });

  return {
    success: true,
    whatsappLink,
    logId: log.id,
  };
}

/**
 * Mark notification as sent (called after user clicks the link)
 */
export async function markNotificationSent(logId: string): Promise<void> {
  await prisma.whatsAppLog.update({
    where: { id: logId },
    data: {
      status: "SENT",
      sentAt: new Date(),
    },
  });
}

/**
 * Notify when payment is verified
 */
export async function notifyPaymentVerified(
  paymentRequestId: string,
): Promise<NotificationResult | null> {
  const request = await prisma.paymentRequest.findUnique({
    where: { id: paymentRequestId },
    include: {
      student: true,
      tuitions: {
        include: { tuition: true },
      },
    },
  });

  if (!request || request.tuitions.length === 0) {
    return null;
  }

  const student = request.student;
  const firstTuition = request.tuitions[0].tuition;
  const periodSummary =
    request.tuitions.length === 1
      ? `${firstTuition.period} ${firstTuition.year}`
      : `${request.tuitions.length} tagihan`;

  const message = `PEMBAYARAN BERHASIL - ${student.name} - ${periodSummary} - Rp ${request.baseAmount.toNumber().toLocaleString("id-ID")}`;

  const whatsappLink = generatePaymentVerifiedLink({
    parentPhone: student.parentPhone,
    studentName: student.name,
    month: periodSummary,
    year: firstTuition.year,
    amount: request.baseAmount.toNumber(),
  });

  return createNotificationLog(
    student.parentPhone,
    "PAYMENT_VERIFIED",
    message,
    whatsappLink,
  );
}

/**
 * Notify payment request created (with transfer instructions)
 */
export async function notifyPaymentRequest(
  paymentRequestId: string,
): Promise<NotificationResult | null> {
  const request = await prisma.paymentRequest.findUnique({
    where: { id: paymentRequestId },
    include: {
      student: true,
      bankAccount: true,
    },
  });

  if (!request || !request.bankAccount) {
    return null;
  }

  const student = request.student;
  const bank = request.bankAccount;

  const message = `INSTRUKSI PEMBAYARAN - ${student.name} - ${bank.bankName} - Rp ${request.totalAmount.toNumber().toLocaleString("id-ID")}`;

  const whatsappLink = generatePaymentRequestLink({
    parentPhone: student.parentPhone,
    studentName: student.name,
    bankName: bank.bankName,
    accountNumber: bank.accountNumber,
    accountName: bank.accountName,
    totalAmount: request.totalAmount.toNumber(),
    expiresInMinutes: 5,
  });

  return createNotificationLog(
    student.parentPhone,
    "PAYMENT_REQUEST",
    message,
    whatsappLink,
  );
}

/**
 * Send payment reminder
 */
export async function sendPaymentReminder(
  tuitionId: string,
): Promise<NotificationResult | null> {
  const tuition = await prisma.tuition.findUnique({
    where: { id: tuitionId },
    include: {
      student: true,
    },
  });

  if (!tuition) {
    return null;
  }

  const student = tuition.student;
  const dueDate = tuition.dueDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const remainingAmount = tuition.feeAmount
    .minus(tuition.scholarshipAmount)
    .minus(tuition.discountAmount)
    .minus(tuition.paidAmount);

  const message = `PENGINGAT PEMBAYARAN - ${student.name} - ${tuition.period} ${tuition.year} - Rp ${remainingAmount.toNumber().toLocaleString("id-ID")}`;

  const whatsappLink = generatePaymentReminderLink({
    parentPhone: student.parentPhone,
    studentName: student.name,
    month: tuition.period,
    year: tuition.year,
    amount: remainingAmount.toNumber(),
    dueDate,
  });

  return createNotificationLog(
    student.parentPhone,
    "PAYMENT_REMINDER",
    message,
    whatsappLink,
  );
}

/**
 * Get notification logs
 */
export async function getNotificationLogs(options: {
  page?: number;
  limit?: number;
  status?: string;
  messageType?: string;
}) {
  const { page = 1, limit = 10, status, messageType } = options;

  const where = {
    ...(status && {
      status: status as "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED",
    }),
    ...(messageType && { messageType }),
  };

  const [logs, total] = await Promise.all([
    prisma.whatsAppLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.whatsAppLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Resend a failed notification (regenerate WhatsApp link)
 */
export async function resendNotification(
  logId: string,
): Promise<NotificationResult | null> {
  const log = await prisma.whatsAppLog.findUnique({
    where: { id: logId },
  });

  if (!log) {
    return null;
  }

  // Create a new log entry with new WhatsApp link
  // The original message is stored in the log, regenerate the link
  const whatsappLink = `https://wa.me/${log.phone.replace(/\D/g, "").replace(/^0/, "62")}?text=${encodeURIComponent(log.message)}`;

  return createNotificationLog(
    log.phone,
    log.messageType as MessageType,
    log.message,
    whatsappLink,
  );
}
