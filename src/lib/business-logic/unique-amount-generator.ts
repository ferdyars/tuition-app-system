import { prisma } from "@/lib/prisma";

interface UniqueAmountResult {
  baseAmount: number;
  uniqueCode: number;
  totalAmount: number;
}

/**
 * Generate unique transfer amount
 * Example: Base Rp 500.000 + unique 123 = Rp 500.123
 */
function generateUniqueAmount(baseAmount: number): UniqueAmountResult {
  const uniqueCode = Math.floor(Math.random() * 999) + 1;
  const totalAmount = baseAmount + uniqueCode;

  return {
    baseAmount,
    uniqueCode,
    totalAmount,
  };
}

/**
 * Get available unique amount (not used by any pending payments across ALL banks)
 * This allows user to transfer to any bank with the same unique code
 */
export async function getAvailableUniqueAmount(
  baseAmount: number,
): Promise<UniqueAmountResult> {
  const maxAttempts = 50;

  for (let i = 0; i < maxAttempts; i++) {
    const result = generateUniqueAmount(baseAmount);

    // Check if amount is already pending (across ALL banks)
    const existing = await prisma.paymentRequest.findFirst({
      where: {
        totalAmount: result.totalAmount,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (!existing) {
      return result;
    }
  }

  throw new Error(
    "Tidak dapat membuat kode unik. Terlalu banyak pembayaran pending.",
  );
}
