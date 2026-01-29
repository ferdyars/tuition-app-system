import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import {
  applyDiscountToTuitions,
  previewDiscountApplication,
} from "@/lib/business-logic/discount-processor";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { discountId, preview } = body;

    if (!discountId) {
      return errorResponse("Discount ID is required", "VALIDATION_ERROR", 400);
    }

    // Check if discount exists
    const discount = await prisma.discount.findUnique({
      where: { id: discountId },
      include: {
        academicYear: { select: { year: true } },
        classAcademic: { select: { className: true } },
      },
    });

    if (!discount) {
      return errorResponse("Discount not found", "NOT_FOUND", 404);
    }

    if (!discount.isActive) {
      return errorResponse(
        "Cannot apply inactive discount",
        "VALIDATION_ERROR",
        400,
      );
    }

    // Preview mode - show what would be affected
    if (preview) {
      const previewResult = await previewDiscountApplication(
        discountId,
        prisma,
      );

      return successResponse({
        preview: true,
        discount: {
          id: discount.id,
          name: discount.name,
          discountAmount: Number(discount.discountAmount),
          targetPeriods: discount.targetPeriods,
          scope: discount.classAcademicId
            ? discount.classAcademic?.className
            : "School-wide",
        },
        affectedTuitions: previewResult.tuitions.map((t) => ({
          id: t.id,
          studentName: (t as { student?: { name: string } }).student?.name,
          studentNis: t.studentNis,
          className: (t as { classAcademic?: { className: string } })
            .classAcademic?.className,
          period: t.period,
          year: t.year,
          currentDiscountAmount: Number(t.discountAmount),
        })),
        summary: {
          tuitionCount: previewResult.tuitionCount,
          totalDiscountAmount: previewResult.totalDiscountAmount,
        },
      });
    }

    // Apply the discount
    const results = await applyDiscountToTuitions(discountId, prisma);

    return successResponse({
      applied: true,
      discount: {
        id: discount.id,
        name: discount.name,
        discountAmount: Number(discount.discountAmount),
      },
      results: {
        tuitionsUpdated: results.length,
        totalDiscountApplied: results.reduce(
          (sum, r) => sum + r.discountAmount,
          0,
        ),
        details: results.slice(0, 100), // Limit details to first 100
      },
    });
  } catch (error) {
    console.error("Apply discount error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to apply discount";
    return errorResponse(message, "SERVER_ERROR", 500);
  }
}
