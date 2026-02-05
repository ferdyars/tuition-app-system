import { prisma } from "@/lib/prisma";

// ============================================
// GET ACTIVE BANK ACCOUNTS (Public)
// ============================================

export async function getActiveBankAccounts() {
  return prisma.schoolBankAccount.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      bankName: true,
      bankCode: true,
      accountNumber: true,
      accountName: true,
      logoUrl: true,
      displayOrder: true,
    },
  });
}

// ============================================
// GET ALL BANK ACCOUNTS (Admin)
// ============================================

export async function getAllBankAccounts() {
  const bankAccounts = await prisma.schoolBankAccount.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      _count: {
        select: {
          paymentRequests: {
            where: { status: "PENDING" },
          },
        },
      },
    },
  });

  return bankAccounts.map((bank) => ({
    id: bank.id,
    bankName: bank.bankName,
    bankCode: bank.bankCode,
    accountNumber: bank.accountNumber,
    accountName: bank.accountName,
    logoUrl: bank.logoUrl,
    displayOrder: bank.displayOrder,
    isActive: bank.isActive,
    pendingPayments: bank._count.paymentRequests,
    createdAt: bank.createdAt,
    updatedAt: bank.updatedAt,
  }));
}

// ============================================
// CREATE BANK ACCOUNT (Admin)
// ============================================

interface CreateBankAccountInput {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  logoUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export async function createBankAccount(input: CreateBankAccountInput) {
  const existing = await prisma.schoolBankAccount.findUnique({
    where: {
      bankCode_accountNumber: {
        bankCode: input.bankCode,
        accountNumber: input.accountNumber,
      },
    },
  });

  if (existing) {
    throw new Error("Bank account with this code and number already exists");
  }

  return prisma.schoolBankAccount.create({
    data: {
      bankName: input.bankName,
      bankCode: input.bankCode,
      accountNumber: input.accountNumber,
      accountName: input.accountName,
      logoUrl: input.logoUrl,
      displayOrder: input.displayOrder ?? 0,
      isActive: input.isActive ?? true,
    },
  });
}

// ============================================
// UPDATE BANK ACCOUNT (Admin)
// ============================================

interface UpdateBankAccountInput {
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  logoUrl?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export async function updateBankAccount(
  id: string,
  input: UpdateBankAccountInput,
) {
  const existing = await prisma.schoolBankAccount.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Bank account not found");
  }

  // Check for duplicate if bankCode or accountNumber is being changed
  if (input.bankCode || input.accountNumber) {
    const duplicate = await prisma.schoolBankAccount.findFirst({
      where: {
        bankCode: input.bankCode || existing.bankCode,
        accountNumber: input.accountNumber || existing.accountNumber,
        id: { not: id },
      },
    });

    if (duplicate) {
      throw new Error("Bank account with this code and number already exists");
    }
  }

  return prisma.schoolBankAccount.update({
    where: { id },
    data: input,
  });
}

// ============================================
// DELETE BANK ACCOUNT (Admin)
// ============================================

export async function deleteBankAccount(id: string) {
  const existing = await prisma.schoolBankAccount.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          paymentRequests: true,
        },
      },
    },
  });

  if (!existing) {
    throw new Error("Bank account not found");
  }

  if (existing._count.paymentRequests > 0) {
    throw new Error(
      "Cannot delete bank account with existing payment requests. Deactivate it instead.",
    );
  }

  return prisma.schoolBankAccount.delete({
    where: { id },
  });
}

// ============================================
// GET BANK ACCOUNT BY ID
// ============================================

export async function getBankAccountById(id: string) {
  const bankAccount = await prisma.schoolBankAccount.findUnique({
    where: { id },
  });

  if (!bankAccount) {
    throw new Error("Bank account not found");
  }

  return bankAccount;
}
