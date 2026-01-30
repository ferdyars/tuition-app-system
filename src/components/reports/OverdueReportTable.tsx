"use client";

import {
  Accordion,
  Badge,
  Button,
  Card,
  Group,
  NumberFormatter,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCash,
  IconDownload,
  IconFilter,
  IconReceipt,
  IconUsers,
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
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [classAcademicId, setClassAcademicId] = useState<string | null>(null);
  const [grade, setGrade] = useState<string | null>(null);

  const { data: academicYearsData } = useAcademicYears({ limit: 100 });
  const activeYear = academicYearsData?.academicYears.find((ay) => ay.isActive);

  const { data: classesData } = useClassAcademics({
    limit: 100,
    academicYearId: academicYearId || activeYear?.id,
  });

  const { data, isLoading } = useOverdueReport({
    academicYearId: academicYearId || activeYear?.id,
    classAcademicId: classAcademicId || undefined,
    grade: grade ? Number(grade) : undefined,
  });

  const { exportReport } = useExportOverdueReport();

  const handleExport = () => {
    exportReport({
      academicYearId: academicYearId || activeYear?.id,
      classAcademicId: classAcademicId || undefined,
      grade: grade ? Number(grade) : undefined,
    });
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

  const overdue = data?.overdue || [];

  return (
    <Stack gap="md">
      {/* Summary Cards */}
      {data && (
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Card withBorder>
            <Group>
              <ThemeIcon size="lg" color="red" variant="light">
                <IconUsers size={20} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Students with Overdue
                </Text>
                <Text size="xl" fw={700}>
                  {data.summary.totalStudents}
                </Text>
              </div>
            </Group>
          </Card>
          <Card withBorder>
            <Group>
              <ThemeIcon size="lg" color="orange" variant="light">
                <IconReceipt size={20} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Overdue Records
                </Text>
                <Text size="xl" fw={700}>
                  {data.summary.totalOverdueRecords}
                </Text>
              </div>
            </Group>
          </Card>
          <Card withBorder>
            <Group>
              <ThemeIcon size="lg" color="red" variant="light">
                <IconCash size={20} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Total Outstanding
                </Text>
                <Text size="xl" fw={700} c="red">
                  <NumberFormatter
                    value={data.summary.totalOverdueAmount}
                    prefix="Rp "
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Text>
              </div>
            </Group>
          </Card>
        </SimpleGrid>
      )}

      {/* Filters */}
      <Paper withBorder p="md">
        <Group gap="md" justify="space-between">
          <Group gap="md">
            <Select
              placeholder="Academic Year"
              leftSection={<IconFilter size={16} />}
              data={academicYearOptions}
              value={academicYearId}
              onChange={(value) => {
                setAcademicYearId(value);
                setClassAcademicId(null);
              }}
              clearable
              w={180}
            />
            <Select
              placeholder="Filter by class"
              data={classOptions}
              value={classAcademicId}
              onChange={setClassAcademicId}
              clearable
              searchable
              w={200}
            />
            <Select
              placeholder="Filter by grade"
              data={GRADES}
              value={grade}
              onChange={setGrade}
              clearable
              w={150}
            />
          </Group>
          <Button
            leftSection={<IconDownload size={18} />}
            variant="light"
            onClick={handleExport}
            disabled={!data || data.overdue.length === 0}
          >
            Export Excel
          </Button>
        </Group>
      </Paper>

      {/* Overdue List */}
      <Paper withBorder>
        {isLoading && (
          <Stack p="md" gap="md">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={100} />
            ))}
          </Stack>
        )}

        {!isLoading && data?.overdue.length === 0 && (
          <Stack align="center" py="xl" gap="md">
            <ThemeIcon size={60} color="green" variant="light">
              <IconAlertTriangle size={30} />
            </ThemeIcon>
            <Text c="dimmed">No overdue payments found</Text>
          </Stack>
        )}

        {!isLoading && overdue.length > 0 && (
          <Accordion>
            {overdue.map((item, index) => (
              <Accordion.Item
                key={`${item.student.nis}-${item.class.className}`}
                value={`item-${index}`}
              >
                <Accordion.Control>
                  <Group justify="space-between" wrap="nowrap" pr="md">
                    <Stack gap={0}>
                      <Group gap="xs">
                        <Text fw={600}>{item.student.name}</Text>
                        <Badge size="sm" variant="light">
                          {item.student.nis}
                        </Badge>
                      </Group>
                      <Text size="sm" c="dimmed">
                        {item.class.className} | {item.student.parentPhone}
                      </Text>
                    </Stack>
                    <Group gap="md">
                      <Badge color="red" size="lg">
                        {item.overdueCount} months
                      </Badge>
                      <Text fw={700} c="red">
                        <NumberFormatter
                          value={item.totalOverdue}
                          prefix="Rp "
                          thousandSeparator="."
                          decimalSeparator=","
                        />
                      </Text>
                    </Group>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Month</Table.Th>
                        <Table.Th>Fee Amount</Table.Th>
                        <Table.Th>Paid</Table.Th>
                        <Table.Th>Outstanding</Table.Th>
                        <Table.Th>Due Date</Table.Th>
                        <Table.Th>Days Overdue</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {item.overduePeriods.map((month) => (
                        <Table.Tr key={month.tuitionId}>
                          <Table.Td>
                            {getMonthDisplayName(month.period)} {month.year}
                          </Table.Td>
                          <Table.Td>
                            <NumberFormatter
                              value={month.feeAmount}
                              prefix="Rp "
                              thousandSeparator="."
                              decimalSeparator=","
                            />
                          </Table.Td>
                          <Table.Td>
                            <NumberFormatter
                              value={month.paidAmount}
                              prefix="Rp "
                              thousandSeparator="."
                              decimalSeparator=","
                            />
                          </Table.Td>
                          <Table.Td>
                            <Text c="red" fw={600}>
                              <NumberFormatter
                                value={month.outstandingAmount}
                                prefix="Rp "
                                thousandSeparator="."
                                decimalSeparator=","
                              />
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            {dayjs(month.dueDate).format("DD/MM/YYYY")}
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={month.daysOverdue > 30 ? "red" : "orange"}
                            >
                              {month.daysOverdue} days
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        )}
      </Paper>
    </Stack>
  );
}
