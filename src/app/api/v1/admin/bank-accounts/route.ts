import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getSessionFromRequest } from "@/lib/auth";
import {
  createBankAccount,
  getAllBankAccounts,
} from "@/lib/business-logic/bank-account";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const bankAccounts = await getAllBankAccounts();

    return successResponse({ bankAccounts });
  } catch (error) {
    console.error("List bank accounts error:", error);
    return errorResponse("Internal server error", "SERVER_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (session.role !== "ADMIN") {
      return errorResponse("Forbidden", "FORBIDDEN", 403);
    }

    const body = await request.json();
    const {
      bankName,
      bankCode,
      accountNumber,
      accountName,
      logoUrl,
      displayOrder,
      isActive,
    } = body;

    if (!bankName || !bankCode || !accountNumber || !accountName) {
      return errorResponse(
        "bankName, bankCode, accountNumber, dan accountName harus diisi",
        "VALIDATION_ERROR",
        400,
      );
    }

    const bankAccount = await createBankAccount({
      bankName,
      bankCode,
      accountNumber,
      accountName,
      logoUrl,
      displayOrder,
      isActive,
    });

    return successResponse(bankAccount, 201);
  } catch (error) {
    console.error("Create bank account error:", error);
    if (error instanceof Error) {
      return errorResponse(error.message, "VALIDATION_ERROR", 400);
    }
    return errorResponse("Internal server error", "SERVER_ERROR", 500);
  }
}
