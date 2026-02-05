/**
 * Payment Reminder Cron Job
 * Sends WhatsApp reminders for upcoming due tuitions
 */

import cron from "node-cron";
import { prisma } from "@/lib/prisma";
import { sendPaymentReminder } from "@/lib/services/notification-service";

/**
 * Send payment reminders for tuitions due in 3 days
 * Runs daily at 8 AM
 */
cron.schedule("0 8 * * *", async () => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Find unpaid/partial tuitions due in next 3 days
    const upcomingDue = await prisma.tuition.findMany({
      where: {
        status: { in: ["UNPAID", "PARTIAL"] },
        dueDate: {
          gte: now,
          lte: threeDaysFromNow,
        },
      },
      include: {
        student: {
          select: {
            nis: true,
            hasAccount: true,
            accountDeleted: true,
          },
        },
      },
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const tuition of upcomingDue) {
      // Only send to students with active accounts
      if (!tuition.student.hasAccount || tuition.student.accountDeleted) {
        continue;
      }

      const result = await sendPaymentReminder(tuition.id);
      if (result?.success) {
        sentCount++;
      } else {
        failedCount++;
      }

      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (sentCount > 0 || failedCount > 0) {
      console.log(
        `[Payment Reminder] Sent ${sentCount}, Failed ${failedCount}`,
      );
    }
  } catch (error) {
    console.error("[Payment Reminder] Error:", error);
  }
});

/**
 * Send overdue reminders
 * Runs daily at 9 AM for tuitions that are overdue
 */
cron.schedule("0 9 * * *", async () => {
  try {
    const now = new Date();

    // Find overdue tuitions (past due date)
    const overdueTuitions = await prisma.tuition.findMany({
      where: {
        status: { in: ["UNPAID", "PARTIAL"] },
        dueDate: { lt: now },
      },
      include: {
        student: {
          select: {
            nis: true,
            hasAccount: true,
            accountDeleted: true,
          },
        },
      },
      take: 100, // Limit to prevent overload
    });

    let sentCount = 0;

    for (const tuition of overdueTuitions) {
      if (!tuition.student.hasAccount || tuition.student.accountDeleted) {
        continue;
      }

      const result = await sendPaymentReminder(tuition.id);
      if (result?.success) {
        sentCount++;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (sentCount > 0) {
      console.log(`[Overdue Reminder] Sent ${sentCount} reminders`);
    }
  } catch (error) {
    console.error("[Overdue Reminder] Error:", error);
  }
});

console.log("[Cron Jobs] Payment reminder jobs scheduled");
