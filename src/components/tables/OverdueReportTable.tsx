"use client";

import {
  Accordion,
  ActionIcon,
  Badge,
  Button,
  Group,
  NumberFormatter,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconChevronDown,
  IconDownload,
  IconFilter,
  IconPhone,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState } from "react";
import { useAcademicYears } from "@/hooks/api/useAcademicYears";
import { useClassAcademics } from "@/hooks/api/useClassAcademics";
import {
  useExportOverdueReport,
  useOverdueReport,
} from "@/hooks/api/useReports";
import { getMonthDisplayName } from "@/lib/business-logic/tuition-generator";

const GRADES = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Grade ${i + 1}`,
}));

export default function OverdueReportTable() {
  const [classAcademicId, setClassAcademicId] = useState<string | null>(null);
  const [grade, setGrade] = useState<string | null>(null);
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);

  const { data: academicYearsData } = useAcademicYears({ limit: 100 });
  const activeYear = academicYearsData?.academicYears.find((ay) => ay.isActive);

  const { data: classesData } = useClassAcademics({
    limit: 100,
    academicYearId: academicYearId || activeYear?.id,
    grade: grade ? Number(grade) : undefined,
  });

  const { data, isLoading } = useOverdueReport({
    classAcademicId: classAcademicId || undefined,
    grade: grade ? Number(grade) : undefined,
    academicYearId: academicYearId || activeYear?.id,
  });

  const { exportReport } = useExportOverdueReport();

  const handleExport = () => {
    exportReport({
      classAcademicId: classAcademicId || undefined,
      grade: grade ? Number(grade) : undefined,
      academicYearId: academicYearId || activeYear?.id,
    });
  };

  const yearOptions =
    academicYearsData?.academicYears?.map((ay) => ({
      value: ay.id,
      label: ay.year + (ay.isActive ? " (Active)" : ""),
    })) || [];

  const classOptions =
    classesData?.classes?.map((c) => ({
      value: c.id,
      label: c.className,
    })) || [];

  const overdue = data?.overdue || [];

  return (
    <Stack gap="md">
      {/* Summary Cards */}
      {data && (
        <Group gap="md" grow>
          <Paper withBorder p="md" radius="md">
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Students with Overdue
              </Text>
              <Text size="xl" fw={700} c="red">
                {data.summary.totalStudents}
              </Text>
            </Stack>
          </Paper>
          <Paper withBorder p="md" radius="md">
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Total Overdue Records
              </Text>
              <Text size="xl" fw={700} c="orange">
                {data.summary.totalOverdueRecords}
              </Text>
            </Stack>
          </Paper>
          <Paper withBorder p="md" radius="md">
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Total Outstanding Amount
              </Text>
              <Text size="xl" fw={700} c="red">
                <NumberFormatter
                  value={data.summary.totalOverdueAmount}
                  prefix="Rp "
                  thousandSeparator="."
                  decimalSeparator=","
                />
              </Text>
            </Stack>
          </Paper>
        </Group>
      )}

      {/* Filters */}
      <Paper withBorder p="md">
        <Group gap="md" grow>
          <Select
            placeholder="Filter by academic year"
            leftSection={<IconFilter size={16} />}
            data={yearOptions}
            value={academicYearId}
            onChange={(value) => {
              setAcademicYearId(value);
              setClassAcademicId(null);
            }}
            clearable
          />
          <Select
            placeholder="Filter by grade"
            data={GRADES}
            value={grade}
            onChange={(value) => {
              setGrade(value);
              setClassAcademicId(null);
            }}
            clearable
          />
          <Select
            placeholder="Filter by class"
            data={classOptions}
            value={classAcademicId}
            onChange={setClassAcademicId}
            clearable
            searchable
          />
          <Button
            leftSection={<IconDownload size={18} />}
            variant="light"
            onClick={handleExport}
            disabled={!data || data.overdue.length === 0}
          >
            Export to Excel
          </Button>
        </Group>
      </Paper>

      {/* Loading State */}
      {isLoading && (
        <Paper withBorder p="md">
          <Stack gap="md">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={`skeleton-${i}`} height={80} />
            ))}
          </Stack>
        </Paper>
      )}

      {/* Empty State */}
      {!isLoading && data?.overdue.length === 0 && (
        <Paper withBorder p="xl">
          <Text ta="center" c="dimmed" py="xl">
            No overdue payments found
          </Text>
        </Paper>
      )}
    </Stack>
  );
}
