import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "10");
  const classAcademicId = searchParams.get("classAcademicId") || undefined;
  const studentNis = searchParams.get("studentNis") || undefined;
  const status = searchParams.get("status") || undefined;
  const month = searchParams.get("month") || undefined;
  const year = searchParams.get("year")
    ? Number(searchParams.get("year"))
    : undefined;
  const dueDateFrom = searchParams.get("dueDateFrom") || undefined;
  const dueDateTo = searchParams.get("dueDateTo") || undefined;

  const where: Prisma.TuitionWhereInput = {};

  if (classAcademicId) {
    where.classAcademicId = classAcademicId;
  }

  if (studentNis) {
    where.studentNis = studentNis;
  }

  if (status) {
    where.status = status as "UNPAID" | "PAID" | "PARTIAL";
  }

  if (month) {
    where.month = month as Prisma.EnumMonthFilter["equals"];
  }

  if (year) {
    where.year = year;
  }

  if (dueDateFrom || dueDateTo) {
    where.dueDate = {};
    if (dueDateFrom) {
      where.dueDate.gte = new Date(dueDateFrom);
    }
    if (dueDateTo) {
      where.dueDate.lte = new Date(dueDateTo);
    }
  }

  const [tuitions, total] = await Promise.all([
    prisma.tuition.findMany({
      where,
      include: {
        student: {
          select: { nis: true, name: true, parentPhone: true },
        },
        classAcademic: {
          select: {
            className: true,
            grade: true,
            section: true,
            academicYear: { select: { year: true } },
          },
        },
        _count: {
          select: { payments: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ year: "desc" }, { month: "asc" }, { student: { name: "asc" } }],
    }),
    prisma.tuition.count({ where }),
  ]);

  // Fetch scholarship info for each tuition's student+class combination
  const tuitionsWithScholarship = await Promise.all(
    tuitions.map(async (tuition) => {
      const scholarship = await prisma.scholarship.findUnique({
        where: {
          studentNis_classAcademicId: {
            studentNis: tuition.studentNis,
            classAcademicId: tuition.classAcademicId,
          },
        },
        select: {
          id: true,
          nominal: true,
          isFullScholarship: true,
        },
      });
      return {
        ...tuition,
        scholarship: scholarship
          ? {
              id: scholarship.id,
              nominal: scholarship.nominal.toString(),
              isFullScholarship: scholarship.isFullScholarship,
            }
          : null,
      };
    })
  );

  return successResponse({
    tuitions: tuitionsWithScholarship,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
