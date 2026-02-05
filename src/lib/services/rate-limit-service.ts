import { RATE_LIMITS } from "@/lib/config/rate-limit-config";
import { prisma } from "@/lib/prisma";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: Date;
  limit: number;
}

/**
 * Check rate limit using PostgreSQL
 * Uses sliding window algorithm with status-based expiration
 */
export async function checkRateLimit(
  action: keyof typeof RATE_LIMITS,
  identifier: string,
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[action];
  const key = `${identifier}:${action}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);
  const expiresAt = new Date(now.getTime() + config.windowMs);

  // Use transaction for atomic check-and-update
  const result = await prisma.$transaction(async (tx) => {
    // Find existing ACTIVE record within current window
    const existing = await tx.rateLimitRecord.findFirst({
      where: {
        key,
        status: "ACTIVE",
        windowStart: { gte: windowStart },
      },
    });

    if (existing) {
      // Check if limit exceeded
      if (existing.count >= config.limit) {
        return {
          success: false,
          remaining: 0,
          reset: existing.expiresAt,
          limit: config.limit,
        };
      }

      // Increment count
      const updated = await tx.rateLimitRecord.update({
        where: { id: existing.id },
        data: { count: existing.count + 1 },
      });

      return {
        success: true,
        remaining: config.limit - updated.count,
        reset: updated.expiresAt,
        limit: config.limit,
      };
    }

    // Use upsert to handle race conditions
    // If record exists (old window), update it to start a new window
    // If record doesn't exist, create it
    const record = await tx.rateLimitRecord.upsert({
      where: { key },
      create: {
        key,
        action,
        identifier,
        count: 1,
        windowStart: now,
        expiresAt,
        status: "ACTIVE",
      },
      update: {
        count: 1,
        windowStart: now,
        expiresAt,
        status: "ACTIVE",
      },
    });

    return {
      success: true,
      remaining: config.limit - record.count,
      reset: record.expiresAt,
      limit: config.limit,
    };
  });

  return result;
}

/**
 * Reset rate limit for a specific key (admin use)
 * Sets status to INACTIVE instead of deleting
 */
export async function resetRateLimit(
  action: string,
  identifier: string,
): Promise<void> {
  const key = `${identifier}:${action}`;

  await prisma.rateLimitRecord.updateMany({
    where: {
      key,
      status: "ACTIVE",
    },
    data: {
      status: "INACTIVE",
    },
  });
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  action: keyof typeof RATE_LIMITS,
  identifier: string,
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[action];
  const key = `${identifier}:${action}`;
  const windowStart = new Date(Date.now() - config.windowMs);

  const existing = await prisma.rateLimitRecord.findFirst({
    where: {
      key,
      status: "ACTIVE",
      windowStart: { gte: windowStart },
    },
  });

  if (!existing) {
    return {
      success: true,
      remaining: config.limit,
      reset: new Date(Date.now() + config.windowMs),
      limit: config.limit,
    };
  }

  return {
    success: existing.count < config.limit,
    remaining: Math.max(0, config.limit - existing.count),
    reset: existing.expiresAt,
    limit: config.limit,
  };
}

/**
 * Get rate limit history for analytics (admin use)
 */
export async function getRateLimitHistory(
  action?: string,
  identifier?: string,
  limit: number = 100,
) {
  return prisma.rateLimitRecord.findMany({
    where: {
      ...(action && { action }),
      ...(identifier && { identifier }),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Deactivate expired rate limit records
 * Run as cron job
 */
export async function deactivateExpiredRateLimits(): Promise<number> {
  const result = await prisma.rateLimitRecord.updateMany({
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
