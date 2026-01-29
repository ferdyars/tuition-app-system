"use client";

import { useState } from "react";
import {
  Paper,
  Stack,
  Select,
  NumberInput,
  Button,
  Alert,
  Text,
  Group,
  Badge,
} from "@mantine/core";
import { IconCheck, IconAlertCircle, IconGift } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useStudents } from "@/hooks/api/useStudents";
import { useClassAcademics } from "@/hooks/api/useClassAcademics";
import { useAcademicYears } from "@/hooks/api/useAcademicYears";
import { useCreateScholarship } from "@/hooks/api/useScholarships";

interface CreationResult {
  scholarship: {
    id: string;
    studentNis: string;
    classAcademicId: string;
    nominal: string;
    isFullScholarship: boolean;
  };
  applicationResult?: {
    isFullScholarship: boolean;
    tuitionsAffected: number;
  };
}

export default function ScholarshipForm() {
  const router = useRouter();
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [classAcademicId, setClassAcademicId] = useState<string | null>(null);
  const [studentNis, setStudentNis] = useState<string | null>(null);
  const [nominal, setNominal] = useState<number | string>(500000);
  const [result, setResult] = useState<CreationResult | null>(null);

  const { data: academicYearsData, isLoading: loadingYears } = useAcademicYears({
    limit: 100,
  });

  const { data: classesData, isLoading: loadingClasses } = useClassAcademics({
    limit: 100,
    academicYearId: academicYearId || undefined,
  });

  const { data: studentsData, isLoading: loadingStudents } = useStudents({
    limit: 1000,
  });

  const createScholarship = useCreateScholarship();

  const handleSubmit = () => {
    if (!studentNis || !classAcademicId || !nominal) {
      notifications.show({
        title: "Validation Error",
        message: "Please fill in all required fields",
        color: "red",
      });
      return;
    }

    createScholarship.mutate(
      {
        studentNis,
        classAcademicId,
        nominal: Number(nominal),
      },
      {
        onSuccess: (data) => {
          setResult(data);
          notifications.show({
            title: "Scholarship Created",
            message: data.applicationResult?.tuitionsAffected
              ? `Scholarship created and ${data.applicationResult.tuitionsAffected} tuitions auto-paid`
              : "Scholarship created successfully",
            color: "green",
          });
        },
        onError: (error) => {
          notifications.show({
            title: "Error",
            message: error.message,
            color: "red",
          });
        },
      }
    );
  };

  const academicYearOptions =
    academicYearsData?.academicYears.map((ay) => ({
      value: ay.id,
      label: `${ay.year}${ay.isActive ? " (Active)" : ""}`,
    })) || [];

  const classOptions =
    classesData?.classes.map((c) => ({
      value: c.id,
      label: c.className,
    })) || [];

  const studentOptions =
    studentsData?.students.map((s) => ({
      value: s.nis,
      label: `${s.nis} - ${s.name}`,
    })) || [];

  return (
    <Paper withBorder p="lg" maw={600}>
      <Stack gap="md">
        <Select
          label="Academic Year"
          placeholder="Select academic year"
          data={academicYearOptions}
          value={academicYearId}
          onChange={(value) => {
            setAcademicYearId(value);
            setClassAcademicId(null);
          }}
          disabled={loadingYears}
          required
        />

        <Select
          label="Class"
          placeholder="Select class"
          data={classOptions}
          value={classAcademicId}
          onChange={setClassAcademicId}
          disabled={!academicYearId || loadingClasses}
          searchable
          required
        />

        <Select
          label="Student"
          placeholder="Select student"
          data={studentOptions}
          value={studentNis}
          onChange={setStudentNis}
          disabled={loadingStudents}
          searchable
          required
        />

        <NumberInput
          label="Scholarship Nominal (Monthly)"
          placeholder="Enter scholarship amount"
          value={nominal}
          onChange={setNominal}
          min={0}
          prefix="Rp "
          thousandSeparator="."
          decimalSeparator=","
          required
        />

        <Alert icon={<IconAlertCircle size={18} />} color="blue" variant="light">
          <Text size="sm">
            If the scholarship nominal covers the full monthly fee, all unpaid
            tuitions for this student in this class will be automatically marked
            as paid.
          </Text>
        </Alert>

        <Group>
          <Button
            leftSection={<IconGift size={18} />}
            onClick={handleSubmit}
            loading={createScholarship.isPending}
            disabled={!studentNis || !classAcademicId || !nominal}
          >
            Create Scholarship
          </Button>
          <Button variant="light" onClick={() => router.push("/scholarships")}>
            View Scholarships
          </Button>
        </Group>

        {result && (
          <Alert
            icon={<IconCheck size={18} />}
            color="green"
            title="Scholarship Created"
          >
            <Stack gap="xs">
              <Group gap="md">
                <Badge
                  color={result.scholarship.isFullScholarship ? "green" : "blue"}
                  size="lg"
                >
                  {result.scholarship.isFullScholarship ? "Full" : "Partial"}{" "}
                  Scholarship
                </Badge>
              </Group>
              {result.applicationResult && (
                <Text size="sm">
                  Auto-paid {result.applicationResult.tuitionsAffected} tuition
                  records
                </Text>
              )}
            </Stack>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
