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
import {
  IconDiscount,
  IconFilter,
  IconGift,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState } from "react";
import { useAcademicYears } from "@/hooks/api/useAcademicYears";
import { useClassAcademics } from "@/hooks/api/useClassAcademics";
import { useDeletePayment, usePayments } from "@/hooks/api/usePayments";
import { useAuth } from "@/hooks/useAuth";
import { getMonthDisplayName } from "@/lib/business-logic/tuition-generator";

export default function PaymentTable() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [classAcademicId, setClassAcademicId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: academicYearsData } = useAcademicYears({ limit: 100 });
  const activeYear = academicYearsData?.academicYears.find((ay) => ay.isActive);

  const { data: classesData } = useClassAcademics({
    limit: 100,
    academicYearId: activeYear?.id,
  });

  const { data, isLoading } = usePayments({
    page,
    limit: 10,
    classAcademicId: classAcademicId || undefined,
    studentNis: studentSearch || undefined,
    paymentDateFrom: dateFrom || undefined,
    paymentDateTo: dateTo || undefined,
  });

  const deletePayment = useDeletePayment();

  const handleDelete = (id: string, studentName: string, amount: string) => {
    modals.openConfirmModal({
      title: "Reverse Payment",
      children: (
        <Stack gap="xs">
          <Text size="sm">
            Are you sure you want to reverse the payment of{" "}
            <strong>
              <NumberFormatter
                value={amount}
                prefix="Rp "
                thousandSeparator="."
                decimalSeparator=","
              />
            </strong>{" "}
            for <strong>{studentName}</strong>?
          </Text>
          <Text size="sm" c="red">
            This will update the tuition status accordingly.
          </Text>
        </Stack>
      ),
      labels: { confirm: "Reverse Payment", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deletePayment.mutate(id, {
          onSuccess: () => {
            notifications.show({
              title: "Payment Reversed",
              message: "Payment has been reversed successfully",
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

  const isAdmin = user?.role === "ADMIN";

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
          <TextInput
            placeholder="Search student NIS"
            leftSection={<IconSearch size={16} />}
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.currentTarget.value)}
          />
          <TextInput
            type="date"
            placeholder="From date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.currentTarget.value)}
          />
          <TextInput
            type="date"
            placeholder="To date"
            value={dateTo}
            onChange={(e) => setDateTo(e.currentTarget.value)}
          />
        </Group>
      </Paper>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={900}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Student</Table.Th>
                <Table.Th>Class</Table.Th>
                <Table.Th>Month</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Cashier</Table.Th>
                <Table.Th>Status</Table.Th>
                {isAdmin && <Table.Th w={80}>Actions</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <Table.Tr key={`skeleton-${i}`}>
                    {Array.from({ length: isAdmin ? 8 : 7 }).map((_, j) => (
                      <Table.Td key={`skeleton-cell-${j}`}>
                        <Skeleton height={20} />
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))}
              {!isLoading && data?.payments.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={isAdmin ? 8 : 7}>
                    <Text ta="center" c="dimmed" py="md">
                      No payments found
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {data?.payments.map((payment) => (
                <Table.Tr key={payment.id}>
                  <Table.Td>
                    <Text size="sm">
                      {dayjs(payment.paymentDate).format("DD/MM/YYYY HH:mm")}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={0}>
                      <Text size="sm" fw={500}>
                        {payment.tuition?.student?.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {payment.tuition?.student?.nis}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {payment.tuition?.classAcademic?.className}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {payment.tuition?.month
                        ? `${getMonthDisplayName(payment.tuition.month)} ${payment.tuition.year}`
                        : "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={2}>
                      <Text size="sm" fw={600} c="green">
                        <NumberFormatter
                          value={payment.amount}
                          prefix="Rp "
                          thousandSeparator="."
                          decimalSeparator=","
                        />
                      </Text>
                      {Number(payment.scholarshipAmount) > 0 &&
                        (() => {
                          const scholarshipAmt = Number(
                            payment.scholarshipAmount,
                          );
                          const feeAmt = Number(
                            payment.tuition?.feeAmount || 0,
                          );
                          const isFullScholarship = scholarshipAmt >= feeAmt;

                          return (
                            <Tooltip
                              label={
                                <Stack gap={2}>
                                  <Text size="xs">
                                    Scholarship:{" "}
                                    <NumberFormatter
                                      value={payment.scholarshipAmount}
                                      prefix="Rp "
                                      thousandSeparator="."
                                      decimalSeparator=","
                                    />
                                  </Text>
                                  {isFullScholarship && (
                                    <Text size="xs" c="teal">
                                      Full scholarship covers entire fee
                                    </Text>
                                  )}
                                </Stack>
                              }
                            >
                              <Badge
                                size="xs"
                                color={isFullScholarship ? "green" : "teal"}
                                variant="light"
                                leftSection={<IconGift size={10} />}
                              >
                                {isFullScholarship
                                  ? "Full Scholarship"
                                  : "Partial Scholarship"}
                              </Badge>
                            </Tooltip>
                          );
                        })()}
                      {Number(payment.tuition?.discountAmount) > 0 &&
                        (() => {
                          return (
                            <Tooltip
                              label={
                                <Stack gap={2}>
                                  <Text size="xs">
                                    Discounts:{" "}
                                    <NumberFormatter
                                      value={payment.tuition?.discountAmount}
                                      prefix="Rp "
                                      thousandSeparator="."
                                      decimalSeparator=","
                                    />
                                  </Text>
                                </Stack>
                              }
                            >
                              <Badge
                                size="xs"
                                color={"teal"}
                                variant="light"
                                leftSection={<IconDiscount size={10} />}
                              >
                                {payment.tuition?.discount?.name || ""}
                              </Badge>
                            </Tooltip>
                          );
                        })()}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{payment.employee?.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        payment.tuition?.status === "PAID"
                          ? "green"
                          : payment.tuition?.status === "PARTIAL"
                            ? "yellow"
                            : "red"
                      }
                      variant="light"
                      size="sm"
                    >
                      {payment.tuition?.status}
                    </Badge>
                  </Table.Td>
                  {isAdmin && (
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label="Reverse Payment">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() =>
                              handleDelete(
                                payment.id,
                                payment.tuition?.student?.name || "",
                                payment.amount,
                              )
                            }
                          >
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
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
