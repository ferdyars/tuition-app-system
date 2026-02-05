import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getSessionFromRequest } from "@/lib/auth";
import {
  deleteBankAccount,
  getBankAccountById,
  updateBankAccount,
} from "@/lib/business-logic/bank-account";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { id } = await params;
    const bankAccount = await getBankAccountById(id);

    return successResponse(bankAccount);
  } catch (error) {
    console.error("Get bank account error:", error);
    if (error instanceof Error) {
      return errorResponse(error.message, "NOT_FOUND", 404);
    }
    return errorResponse("Internal server error", "SERVER_ERROR", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (session.role !== "ADMIN") {
      return errorResponse("Forbidden", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const body = await request.json();

    const bankAccount = await updateBankAccount(id, body);

    return successResponse(bankAccount);
  } catch (error) {
    console.error("Update bank account error:", error);
    if (error instanceof Error) {
      return errorResponse(error.message, "VALIDATION_ERROR", 400);
    }
    return errorResponse("Internal server error", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (session.role !== "ADMIN") {
      return errorResponse("Forbidden", "FORBIDDEN", 403);
    }

    const { id } = await params;
    await deleteBankAccount(id);

    return successResponse({ message: "Bank account berhasil dihapus" });
  } catch (error) {
    console.error("Delete bank account error:", error);
    if (error instanceof Error) {
      return errorResponse(error.message, "VALIDATION_ERROR", 400);
    }
    return errorResponse("Internal server error", "SERVER_ERROR", 500);
  }
}
