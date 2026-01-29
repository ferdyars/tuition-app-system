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
  List,
} from "@mantine/core";
import {
  IconCheck,
  IconAlertCircle,
  IconReceipt,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useClassAcademics } from "@/hooks/api/useClassAcademics";
import { useAcademicYears } from "@/hooks/api/useAcademicYears";
import { useGenerateTuitions } from "@/hooks/api/useTuitions";

interface GenerationResult {
  generated: number;
  skipped: number;
  details: {
    totalStudents: number;
    studentsWithFullYear: number;
    studentsWithPartialYear: number;
    className: string;
    academicYear: string;
  };
}

export default function TuitionGeneratorForm() {
  const router = useRouter();
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [classAcademicId, setClassAcademicId] = useState<string | null>(null);
  const [feeAmount, setFeeAmount] = useState<number | string>(500000);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const { data: academicYearsData, isLoading: loadingYears } = useAcademicYears({
    limit: 100,
  });

  const { data: classesData, isLoading: loadingClasses } = useClassAcademics({
    limit: 100,
    academicYearId: academicYearId || undefined,
  });

  const generateTuitions = useGenerateTuitions();

  // Auto-select active academic year
  useState(() => {
    if (academicYearsData?.academicYears) {
      const activeYear = academicYearsData.academicYears.find((ay) => ay.isActive);
      if (activeYear) {
        setAcademicYearId(activeYear.id);
      }
    }
  });

  const handleGenerate = () => {
    if (!classAcademicId || !feeAmount) {
      notifications.show({
        title: "Validation Error",
        message: "Please select a class and enter a fee amount",
        color: "red",
      });
      return;
    }

    generateTuitions.mutate(
      {
        classAcademicId,
        feeAmount: Number(feeAmount),
      },
      {
        onSuccess: (data) => {
          setResult(data);
          notifications.show({
            title: "Tuitions Generated",
            message: `Successfully generated ${data.generated} tuition records`,
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

        <NumberInput
          label="Monthly Fee Amount"
          placeholder="Enter fee amount"
          value={feeAmount}
          onChange={setFeeAmount}
          min={0}
          prefix="Rp "
          thousandSeparator="."
          decimalSeparator=","
          required
        />

        <Alert icon={<IconAlertCircle size={18} />} color="blue" variant="light">
          <Text size="sm">
            Tuitions will be generated for all students. Students who joined
            mid-year will only have tuitions generated from their join month
            onwards.
          </Text>
        </Alert>

        <Group>
          <Button
            leftSection={<IconReceipt size={18} />}
            onClick={handleGenerate}
            loading={generateTuitions.isPending}
            disabled={!classAcademicId || !feeAmount}
          >
            Generate Tuitions
          </Button>
          <Button variant="light" onClick={() => router.push("/tuitions")}>
            View Tuitions
          </Button>
        </Group>

        {result && (
          <Alert
            icon={<IconCheck size={18} />}
            color="green"
            title="Generation Complete"
          >
            <Stack gap="xs">
              <Group gap="md">
                <Badge color="green" size="lg">
                  Generated: {result.generated}
                </Badge>
                <Badge color="gray" size="lg">
                  Skipped: {result.skipped}
                </Badge>
              </Group>
              <List size="sm">
                <List.Item>Class: {result.details.className}</List.Item>
                <List.Item>
                  Academic Year: {result.details.academicYear}
                </List.Item>
                <List.Item>
                  Total Students: {result.details.totalStudents}
                </List.Item>
                <List.Item>
                  Full Year Students: {result.details.studentsWithFullYear}
                </List.Item>
                <List.Item>
                  Mid-Year Students: {result.details.studentsWithPartialYear}
                </List.Item>
              </List>
            </Stack>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
