"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  NumberFormatter,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconGift,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAcademicYears } from "@/hooks/api/useAcademicYears";
import { useClassAcademics } from "@/hooks/api/useClassAcademics";
import { useCreateScholarship } from "@/hooks/api/useScholarships";
import { useStudents } from "@/hooks/api/useStudents";
import { useTuitions } from "@/hooks/api/useTuitions";

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

const SCHOLARSHIP_TYPES = [
  { value: "Academic", label: "Academic Scholarship" },
  { value: "Sports", label: "Sports Scholarship" },
  { value: "Arts", label: "Arts Scholarship" },
  { value: "Need-based", label: "Need-based Scholarship" },
  { value: "Merit", label: "Merit Scholarship" },
  { value: "Other", label: "Other" },
];

export default function ScholarshipForm() {
  const router = useRouter();
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [classAcademicId, setClassAcademicId] = useState<string | null>(null);
  const [studentNis, setStudentNis] = useState<string | null>(null);
  const [scholarshipName, setScholarshipName] = useState<string | null>(
    "Academic",
  );
  const [nominal, setNominal] = useState<number | string>(500000);
  const [result, setResult] = useState<CreationResult | null>(null);

  const { data: academicYearsData, isLoading: loadingYears } = useAcademicYears(
    {
      limit: 100,
    },
  );

  const { data: classesData, isLoading: loadingClasses } = useClassAcademics({
    limit: 100,
    academicYearId: academicYearId || undefined,
  });

  const { data: studentsData, isLoading: loadingStudents } = useStudents({
    limit: 1000,
  });

  // Fetch tuitions for the selected class to get the fee amount
  const { data: tuitionsData } = useTuitions({
    classAcademicId: classAcademicId || undefined,
    limit: 1,
  });

  // Get the tuition fee for the selected class
  const classTuitionFee = useMemo(() => {
    if (!tuitionsData?.tuitions?.length) return null;
    return Number(tuitionsData.tuitions[0].feeAmount);
  }, [tuitionsData]);

  const createScholarship = useCreateScholarship();

  const handleSubmit = () => {
    if (!studentNis || !classAcademicId || !nominal || !scholarshipName) {
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
        name: scholarshipName,
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
      },
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

        <Select
          label="Scholarship Type"
          placeholder="Select scholarship type"
          data={SCHOLARSHIP_TYPES}
          value={scholarshipName}
          onChange={setScholarshipName}
          searchable
          required
        />

        {/* Tuition Fee Reference Card */}
        {classAcademicId && (
          <Card withBorder bg="gray.0">
            <Group gap="xs" mb="xs">
              <IconInfoCircle size={18} color="var(--mantine-color-blue-6)" />
              <Text size="sm" fw={600}>
                Class Tuition Reference
              </Text>
            </Group>
            {classTuitionFee ? (
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Monthly Tuition Fee:
                  </Text>
                  <Text size="sm" fw={600}>
                    <NumberFormatter
                      value={classTuitionFee}
                      prefix="Rp "
                      thousandSeparator="."
                      decimalSeparator=","
                    />
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  Set scholarship nominal up to this amount for full
                  scholarship, or less for partial scholarship.
                </Text>
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">
                No tuitions generated yet for this class. Create tuitions first
                to see the fee amount.
              </Text>
            )}
          </Card>
        )}

        <NumberInput
          label="Scholarship Nominal (Monthly)"
          placeholder="Enter scholarship amount"
          description={
            classTuitionFee
              ? `Max: Rp ${classTuitionFee.toLocaleString("id-ID")} (full scholarship)`
              : undefined
          }
          value={nominal}
          onChange={setNominal}
          min={0}
          max={classTuitionFee || undefined}
          prefix="Rp "
          thousandSeparator="."
          decimalSeparator=","
          required
        />

        {classTuitionFee && Number(nominal) > 0 && (
          <Alert
            icon={
              Number(nominal) >= classTuitionFee ? (
                <IconGift size={18} />
              ) : (
                <IconInfoCircle size={18} />
              )
            }
            color={Number(nominal) >= classTuitionFee ? "green" : "blue"}
            variant="light"
          >
            <Text size="sm">
              {Number(nominal) >= classTuitionFee ? (
                <>
                  <strong>Full Scholarship:</strong> All unpaid tuitions for
                  this student in this class will be automatically marked as
                  paid.
                </>
              ) : (
                <>
                  <strong>Partial Scholarship:</strong> Student will pay{" "}
                  <NumberFormatter
                    value={classTuitionFee - Number(nominal)}
                    prefix="Rp "
                    thousandSeparator="."
                    decimalSeparator=","
                  />{" "}
                  per month (original fee minus scholarship).
                </>
              )}
            </Text>
          </Alert>
        )}

        {!classTuitionFee && (
          <Alert
            icon={<IconAlertCircle size={18} />}
            color="yellow"
            variant="light"
          >
            <Text size="sm">
              Select a class with generated tuitions to see fee reference and
              automatically determine if this is a full or partial scholarship.
            </Text>
          </Alert>
        )}

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
                  color={
                    result.scholarship.isFullScholarship ? "green" : "blue"
                  }
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
