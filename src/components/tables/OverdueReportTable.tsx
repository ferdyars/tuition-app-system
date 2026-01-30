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

      {/* Overdue Report Accordion */}
      {!isLoading && overdue.length > 0 && (
        <Accordion variant="separated" chevron={<IconChevronDown size={20} />}>
          {overdue.map((item, index) => (
            <Accordion.Item
              key={`${item.student.nis}-${item.class.className}-${index}`}
              value={`${item.student.nis}-${item.class.className}-${index}`}
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
                      {item.class.className}
                    </Text>
                  </Stack>
                  <Group gap="md">
                    <Stack gap={0} align="flex-end">
                      <Text size="sm" c="dimmed">
                        Overdue Amount
                      </Text>
                      <Text fw={700} c="red">
                        <NumberFormatter
                          value={item.totalOverdue}
                          prefix="Rp "
                          thousandSeparator="."
                          decimalSeparator=","
                        />
                      </Text>
                    </Stack>
                    <Badge color="red" size="lg">
                      {item.overdueCount} months
                    </Badge>
                  </Group>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  {/* Parent Info */}
                  <Paper withBorder p="sm" bg="gray.0">
                    <Group gap="md">
                      <Stack gap={0}>
                        <Text size="sm" c="dimmed">
                          Parent Name
                        </Text>
                        <Text fw={500}>{item.student.parentName || "-"}</Text>
                      </Stack>
                      <Stack gap={0}>
                        <Text size="sm" c="dimmed">
                          Phone
                        </Text>
                        <Group gap="xs">
                          <Text fw={500}>{item.student.parentPhone}</Text>
                          <Tooltip label="Call parent">
                            <ActionIcon
                              variant="subtle"
                              color="green"
                              size="sm"
                              component="a"
                              href={`tel:${item.student.parentPhone}`}
                            >
                              <IconPhone size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Stack>
                    </Group>
                  </Paper>

                  {/* Overdue Months Table */}
                  <Table.ScrollContainer minWidth={700}>
                    <Table striped highlightOnHover withTableBorder>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Month</Table.Th>
                          <Table.Th>Due Date</Table.Th>
                          <Table.Th ta="right" align="right">
                            Fee Amount
                          </Table.Th>
                          <Table.Th ta="right" align="right">
                            Scholarship Amount
                          </Table.Th>
                          <Table.Th ta="right" align="right">
                            Discount Amount
                          </Table.Th>
                          <Table.Th ta="right" align="right">
                            Paid Amount
                          </Table.Th>
                          <Table.Th ta="right" align="right">
                            Outstanding
                          </Table.Th>
                          <Table.Th>Days Overdue</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {item.overduePeriods?.map((month) => (
                          <Table.Tr key={month.tuitionId}>
                            <Table.Td>
                              <Text size="sm">
                                {getMonthDisplayName(month.period)} {month.year}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">
                                {dayjs(month.dueDate).format("DD/MM/YYYY")}
                              </Text>
                            </Table.Td>
                            <Table.Td ta="right" align="right">
                              <NumberFormatter
                                value={month.feeAmount}
                                prefix="Rp "
                                thousandSeparator="."
                                decimalSeparator=","
                              />
                            </Table.Td>
                            <Table.Td ta="right" align="right" c="blue">
                              <NumberFormatter
                                value={month.scholarshipAmount || "-"}
                                prefix="Rp "
                                thousandSeparator="."
                                decimalSeparator=","
                              />
                            </Table.Td>
                            <Table.Td ta="right" align="right" c="blue">
                              <NumberFormatter
                                value={month.discountAmount * -1 || "-"}
                                prefix="Rp "
                                thousandSeparator="."
                                decimalSeparator=","
                              />
                            </Table.Td>
                            <Table.Td ta="right" align="right">
                              <NumberFormatter
                                value={month.paidAmount || "-"}
                                prefix="Rp "
                                thousandSeparator="."
                                decimalSeparator=","
                              />
                            </Table.Td>
                            <Table.Td ta="right" align="right">
                              <Text fw={600} c="red">
                                <NumberFormatter
                                  value={month.outstandingAmount}
                                  prefix="Rp "
                                  thousandSeparator="."
                                  decimalSeparator=","
                                />
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                color={
                                  month.daysOverdue > 30
                                    ? "red"
                                    : month.daysOverdue > 14
                                      ? "orange"
                                      : "yellow"
                                }
                                variant="light"
                              >
                                {month.daysOverdue} days
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </Stack>
  );
}
