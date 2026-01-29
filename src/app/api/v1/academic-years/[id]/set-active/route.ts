import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const existing = await prisma.academicYear.findUnique({ where: { id } });
  if (!existing) {
    return errorResponse("Academic year not found", "NOT_FOUND", 404);
  }

  // Deactivate all, then activate the selected one
  await prisma.$transaction([
    prisma.academicYear.updateMany({
      data: { isActive: false },
    }),
    prisma.academicYear.update({
      where: { id },
      data: { isActive: true },
    }),
  ]);

  const updated = await prisma.academicYear.findUnique({ where: { id } });

  return successResponse(updated);
}
