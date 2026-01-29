import type { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || undefined;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { nis: { contains: search, mode: "insensitive" } },
      { nik: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.student.count({ where }),
  ]);

  return successResponse({
    students,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { nis, nik, name, address, parentName, parentPhone, startJoinDate } =
      body;

    if (
      !nis ||
      !nik ||
      !name ||
      !address ||
      !parentName ||
      !parentPhone ||
      !startJoinDate
    ) {
      return errorResponse("All fields are required", "VALIDATION_ERROR", 400);
    }

    const existingNis = await prisma.student.findUnique({ where: { nis } });
    if (existingNis) {
      return errorResponse("NIS already exists", "DUPLICATE_ENTRY", 409);
    }

    const existingNik = await prisma.student.findUnique({ where: { nik } });
    if (existingNik) {
      return errorResponse("NIK already exists", "DUPLICATE_ENTRY", 409);
    }

    const student = await prisma.student.create({
      data: {
        nis,
        nik,
        name,
        address,
        parentName,
        parentPhone,
        startJoinDate: new Date(startJoinDate),
      },
    });

    return successResponse(student, 201);
  } catch (error) {
    console.error("Create student error:", error);
    return errorResponse("Failed to create student", "SERVER_ERROR", 500);
  }
}
