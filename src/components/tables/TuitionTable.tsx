"use client";

import {
  ActionIcon,
  Badge,
  Group,
  NumberFormatter,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconFilter, IconSearch, IconTrash } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState } from "react";
import type { Month, PaymentStatus } from "@/generated/prisma/client";
import { useAcademicYears } from "@/hooks/api/useAcademicYears";
import { useClassAcademics } from "@/hooks/api/useClassAcademics";
import { useDeleteTuition, useTuitions } from "@/hooks/api/useTuitions";
import { getMonthDisplayName } from "@/lib/business-logic/tuition-generator";

const STATUS_COLORS: Record<PaymentStatus, string> = {
  UNPAID: "red",
  PARTIAL: "yellow",
  PAID: "green",
};

const MONTHS: Month[] = [
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
];

export default function TuitionTable() {
  const [page, setPage] = useState(1);
  const [classAcademicId, setClassAcademicId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");

  const { data: academicYearsData } = useAcademicYears({ limit: 100 });
  const activeYear = academicYearsData?.academicYears.find((ay) => ay.isActive);

  const { data: classesData } = useClassAcademics({
    limit: 100,
    academicYearId: activeYear?.id,
  });

  const { data, isLoading } = useTuitions({
    page,
    limit: 10,
    classAcademicId: classAcademicId || undefined,
    status: status as PaymentStatus | undefined,
    month: month || undefined,
    studentNis: studentSearch || undefined,
  });

  const deleteTuition = useDeleteTuition();

  const handleDelete = (id: string, studentName: string, monthName: string) => {
    modals.openConfirmModal({
      title: "Delete Tuition",
      children: (
        <Text size="sm">
          Are you sure you want to delete the {monthName} tuition for{" "}
          <strong>{studentName}</strong>? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteTuition.mutate(id, {
          onSuccess: () => {
            notifications.show({
              title: "Deleted",
              message: "Tuition deleted successfully",
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
        });
      },
    });
  };

  const classOptions =
    classesData?.classes.map((c) => ({
      value: c.id,
      label: c.className,
    })) || [];

  const monthOptions = MONTHS.map((m) => ({
    value: m,
    label: getMonthDisplayName(m),
  }));

  return (
    <Stack gap="md">
      <Paper withBorder p="md">
        <Group gap="md" grow>
          <Select
            placeholder="Filter by class"
            leftSection={<IconFilter size={16} />}
            data={classOptions}
            value={classAcademicId}
            onChange={setClassAcademicId}
            clearable
            searchable
          />
          <Select
            placeholder="Filter by status"
            data={[
              { value: "UNPAID", label: "Unpaid" },
              { value: "PARTIAL", label: "Partial" },
              { value: "PAID", label: "Paid" },
            ]}
            value={status}
            onChange={setStatus}
            clearable
          />
          <Select
            placeholder="Filter by month"
            data={monthOptions}
            value={month}
            onChange={setMonth}
            clearable
          />
          <TextInput
            placeholder="Search student NIS"
            leftSection={<IconSearch size={16} />}
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.currentTarget.value)}
          />
        </Group>
      </Paper>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Student</Table.Th>
              <Table.Th>Class</Table.Th>
              <Table.Th>Month</Table.Th>
              <Table.Th>Fee Amount</Table.Th>
              <Table.Th>Paid Amount</Table.Th>
              <Table.Th>Due Date</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th w={80}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <Table.Tr key={`skeleton-${i}`}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <Table.Td key={`skeleton-cell-${j}`}>
                      <Skeleton height={20} />
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            {!isLoading && data?.tuitions.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text ta="center" c="dimmed" py="md">
                    No tuitions found
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {data?.tuitions.map((tuition) => (
              <Table.Tr key={tuition.id}>
                <Table.Td>
                  <Stack gap={0}>
                    <Text size="sm" fw={500}>
                      {tuition.student?.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {tuition.studentNis}
                    </Text>
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{tuition.classAcademic?.className}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {getMonthDisplayName(tuition.month)} {tuition.year}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <NumberFormatter
                    value={tuition.feeAmount}
                    prefix="Rp "
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Table.Td>
                <Table.Td>
                  <NumberFormatter
                    value={tuition.paidAmount}
                    prefix="Rp "
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {dayjs(tuition.dueDate).format("DD/MM/YYYY")}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={STATUS_COLORS[tuition.status]} variant="light">
                    {tuition.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="Delete">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() =>
                          handleDelete(
                            tuition.id,
                            tuition.student?.name || "",
                            getMonthDisplayName(tuition.month),
                          )
                        }
                        disabled={(tuition._count?.payments ?? 0) > 0}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      {data && data.pagination.totalPages > 1 && (
        <Group justify="center">
          <Pagination
            total={data.pagination.totalPages}
            value={page}
            onChange={setPage}
          />
        </Group>
      )}
    </Stack>
  );
}
