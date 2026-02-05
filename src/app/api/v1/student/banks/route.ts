import { errorResponse, successResponse } from "@/lib/api-response";
import { getActiveBankAccounts } from "@/lib/business-logic/bank-account";

export async function GET() {
  try {
    const banks = await getActiveBankAccounts();
    return successResponse({ banks });
  } catch (error) {
    console.error("Get banks error:", error);
    return errorResponse("Internal server error", "SERVER_ERROR", 500);
  }
}
