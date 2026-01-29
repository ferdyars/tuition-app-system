import type {
  Month,
  PaymentStatus,
  PrismaClient,
} from "@/generated/prisma/client";

export interface OverdueItem {
  tuitionId: string;
  studentNis: string;
  studentName: string;
  parentPhone: string;
  className: string;
  grade: number;
  section: string;
  month: Month;
  year: number;
  feeAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  dueDate: Date;
  daysOverdue: number;
}

export interface OverdueByStudent {
  student: {
    nis: string;
    name: string;
    parentName: string;
    parentPhone: string;
  };
  class: {
    className: string;
    grade: number;
    section: string;
  };
  overdueMonths: Array<{
    tuitionId: string;
    month: Month;
    year: number;
    feeAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    dueDate: Date;
    daysOverdue: number;
  }>;
  totalOverdue: number;
  overdueCount: number;
}

export interface OverdueSummary {
  totalStudents: number;
  totalOverdueAmount: number;
  totalOverdueRecords: number;
}

/**
 * Calculate days overdue from due date
 */
export function calculateDaysOverdue(dueDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  if (today <= due) return 0;

  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get overdue tuitions with filters
 */
export async function getOverdueTuitions(
  filters: {
    classAcademicId?: string;
    grade?: number;
    academicYearId?: string;
  },
  prisma: PrismaClient,
): Promise<OverdueItem[]> {
  const today = new Date();

  const where: Record<string, unknown> = {
    status: { in: ["UNPAID", "PARTIAL"] as PaymentStatus[] },
    dueDate: { lt: today },
  };

  if (filters.classAcademicId) {
    where.classAcademicId = filters.classAcademicId;
  }

  if (filters.grade || filters.academicYearId) {
    where.classAcademic = {};
    if (filters.grade) {
      (where.classAcademic as Record<string, unknown>).grade = filters.grade;
    }
    if (filters.academicYearId) {
      (where.classAcademic as Record<string, unknown>).academicYearId =
        filters.academicYearId;
    }
  }

  const tuitions = await prisma.tuition.findMany({
    where,
    include: {
      student: true,
      classAcademic: {
        include: {
          academicYear: true,
        },
      },
    },
    orderBy: [{ dueDate: "asc" }, { student: { name: "asc" } }],
  });

  return tuitions.map((t) => ({
    tuitionId: t.id,
    studentNis: t.studentNis,
    studentName: t.student.name,
    parentPhone: t.student.parentPhone,
    className: t.classAcademic.className,
    grade: t.classAcademic.grade,
    section: t.classAcademic.section,
    month: t.month,
    year: t.year,
    feeAmount: Number(t.feeAmount),
    paidAmount: Number(t.paidAmount),
    outstandingAmount: Number(t.feeAmount) - Number(t.paidAmount),
    dueDate: t.dueDate,
    daysOverdue: calculateDaysOverdue(t.dueDate),
  }));
}

/**
 * Group overdue items by student
 */
export function groupOverdueByStudent(
  items: OverdueItem[],
  studentDetails: Map<string, { parentName: string }>,
): OverdueByStudent[] {
  const grouped = new Map<string, OverdueByStudent>();

  items.forEach((item) => {
    const key = `${item.studentNis}-${item.className}`;

    if (!grouped.has(key)) {
      const details = studentDetails.get(item.studentNis);
      grouped.set(key, {
        student: {
          nis: item.studentNis,
          name: item.studentName,
          parentName: details?.parentName || "",
          parentPhone: item.parentPhone,
        },
        class: {
          className: item.className,
          grade: item.grade,
          section: item.section,
        },
        overdueMonths: [],
        totalOverdue: 0,
        overdueCount: 0,
      });
    }

    const student = grouped.get(key)!;
    student.overdueMonths.push({
      tuitionId: item.tuitionId,
      month: item.month,
      year: item.year,
      feeAmount: item.feeAmount,
      paidAmount: item.paidAmount,
      outstandingAmount: item.outstandingAmount,
      dueDate: item.dueDate,
      daysOverdue: item.daysOverdue,
    });
    student.totalOverdue += item.outstandingAmount;
    student.overdueCount++;
  });

  return Array.from(grouped.values());
}

/**
 * Calculate overdue summary statistics
 */
export function calculateOverdueSummary(items: OverdueItem[]): OverdueSummary {
  const uniqueStudents = new Set(items.map((i) => i.studentNis));

  return {
    totalStudents: uniqueStudents.size,
    totalOverdueAmount: items.reduce((sum, i) => sum + i.outstandingAmount, 0),
    totalOverdueRecords: items.length,
  };
}

/**
 * Get class summary statistics
 */
export async function getClassSummary(
  filters: {
    academicYearId?: string;
  },
  prisma: PrismaClient,
): Promise<
  Array<{
    class: {
      id: string;
      className: string;
      grade: number;
      section: string;
    };
    statistics: {
      totalStudents: number;
      totalTuitions: number;
      paid: number;
      unpaid: number;
      partial: number;
      totalFees: number;
      totalPaid: number;
      totalOutstanding: number;
    };
  }>
> {
  const classWhere: Record<string, unknown> = {};
  if (filters.academicYearId) {
    classWhere.academicYearId = filters.academicYearId;
  }

  const classes = await prisma.classAcademic.findMany({
    where: classWhere,
    include: {
      tuitions: {
        select: {
          studentNis: true,
          feeAmount: true,
          paidAmount: true,
          status: true,
        },
      },
    },
    orderBy: [{ grade: "asc" }, { section: "asc" }],
  });

  return classes.map((cls) => {
    const uniqueStudents = new Set(cls.tuitions.map((t) => t.studentNis));
    const paid = cls.tuitions.filter((t) => t.status === "PAID").length;
    const unpaid = cls.tuitions.filter((t) => t.status === "UNPAID").length;
    const partial = cls.tuitions.filter((t) => t.status === "PARTIAL").length;
    const totalFees = cls.tuitions.reduce(
      (sum, t) => sum + Number(t.feeAmount),
      0,
    );
    const totalPaid = cls.tuitions.reduce(
      (sum, t) => sum + Number(t.paidAmount),
      0,
    );

    return {
      class: {
        id: cls.id,
        className: cls.className,
        grade: cls.grade,
        section: cls.section,
      },
      statistics: {
        totalStudents: uniqueStudents.size,
        totalTuitions: cls.tuitions.length,
        paid,
        unpaid,
        partial,
        totalFees,
        totalPaid,
        totalOutstanding: totalFees - totalPaid,
      },
    };
  });
}
