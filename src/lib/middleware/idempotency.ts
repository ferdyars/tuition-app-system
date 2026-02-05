import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Generate idempotency key from request data
 * Uses SHA256 hash of user + action + payload + time window
 */
export function generateIdempotencyKey(
  userId: string,
  action: string,
  payload: object,
): string {
  const data = JSON.stringify({
    userId,
    action,
    payload,
    timestamp: Math.floor(Date.now() / 60000), // 1-minute window
  });

  return createHash("sha256").update(data).digest("hex");
}

/**
 * Check idempotency and execute action if not duplicate
 * Only checks ACTIVE records within expiry window
 */
export async function withIdempotency<T>(
  key: string,
  action: () => Promise<T>,
  ttlHours: number = 24,
): Promise<{ isDuplicate: boolean; result: T }> {
  // Check if ACTIVE key exists and not expired
  const existing = await prisma.idempotencyRecord.findFirst({
    where: {
      key,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
  });

  if (existing) {
    // Return cached result
    return {
      isDuplicate: true,
      result: JSON.parse(existing.response) as T,
    };
  }

  // Execute action
  const result = await action();

  // Store result with TTL
  await prisma.idempotencyRecord.upsert({
    where: { key },
    create: {
      key,
      response: JSON.stringify(result),
      expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
      status: "ACTIVE",
    },
    update: {
      response: JSON.stringify(result),
      expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
      status: "ACTIVE",
    },
  });

  return { isDuplicate: false, result };
}

/**
 * Deactivate expired idempotency records
 * Run as cron job (marks INACTIVE instead of delete)
 */
export async function deactivateExpiredIdempotencyRecords(): Promise<number> {
  const result = await prisma.idempotencyRecord.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lt: new Date() },
    },
    data: {
      status: "INACTIVE",
    },
  });

  return result.count;
}

/**
 * Get idempotency history for debugging (admin use)
 */
export async function getIdempotencyHistory(
  keyPattern?: string,
  limit: number = 100,
) {
  return prisma.idempotencyRecord.findMany({
    where: keyPattern
      ? {
          key: { contains: keyPattern },
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
