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
  Tooltip,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconEdit,
  IconFilter,
  IconPlayerPlay,
  IconTrash,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAcademicYears } from "@/hooks/api/useAcademicYears";
import {
  useApplyDiscount,
  useApplyDiscountPreview,
  useDeleteDiscount,
  useDiscounts,
} from "@/hooks/api/useDiscounts";
import { getPeriodDisplayName } from "@/lib/business-logic/tuition-generator";

export default function DiscountTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<string | null>("true");

  const { data: academicYearsData } = useAcademicYears({ limit: 100 });
  const activeYear = academicYearsData?.academicYears.find((ay) => ay.isActive);

  // Set default academic year
  const effectiveAcademicYearId = academicYearId || activeYear?.id;

  const { data, isLoading } = useDiscounts({
    page,
    limit: 10,
    academicYearId: effectiveAcademicYearId,
    isActive: isActive === null ? undefined : isActive === "true",
  });

  const deleteDiscount = useDeleteDiscount();
  const applyPreview = useApplyDiscountPreview();
  const applyDiscount = useApplyDiscount();

  const handleDelete = (id: string, name: string) => {
    modals.openConfirmModal({
      title: "Delete Discount",
      children: (
        <Stack gap="xs">
          <Text size="sm">
            Are you sure you want to delete the discount <strong>{name}</strong>
            ?
          </Text>
          <Text size="sm" c="dimmed">
            This will remove the discount from all affected tuitions.
          </Text>
        </Stack>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteDiscount.mutate(id, {
          onSuccess: () => {
            notifications.show({
              title: "Deleted",
              message: "Discount deleted successfully",
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

  const handleApply = async (id: string, name: string) => {
    try {
      const preview = await applyPreview.mutateAsync(id);

      modals.openConfirmModal({
        title: "Apply Discount",
        children: (
          <Stack gap="xs">
            <Text size="sm">
              Apply <strong>{name}</strong> to{" "}
              <strong>{preview.summary.tuitionCount}</strong> tuitions?
            </Text>
            <Text size="sm">
              Total discount:{" "}
              <NumberFormatter
                value={preview.summary.totalDiscountAmount}
                prefix="Rp "
                thousandSeparator="."
                decimalSeparator=","
              />
            </Text>
            {preview.affectedTuitions.length > 0 && (
              <Text size="xs" c="dimmed">
                Affecting students:{" "}
                {[
                  ...new Set(
                    preview.affectedTuitions.map((t) => t.studentName),
                  ),
                ]
                  .slice(0, 5)
                  .join(", ")}
                {preview.affectedTuitions.length > 5 && " and more..."}
              </Text>
            )}
          </Stack>
        ),
        labels: { confirm: "Apply", cancel: "Cancel" },
        confirmProps: { color: "blue" },
        onConfirm: () => {
          applyDiscount.mutate(id, {
            onSuccess: (result) => {
              notifications.show({
                title: "Discount Applied",
                message: `Applied to ${result.results.tuitionsUpdated} tuitions`,
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
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error instanceof Error ? error.message : "Failed to preview discount",
        color: "red",
      });
    }
  };

  const academicYearOptions =
    academicYearsData?.academicYears.map((ay) => ({
      value: ay.id,
      label: `${ay.year}${ay.isActive ? " (Active)" : ""}`,
    })) || [];

  return (
    <Stack gap="md">
      <Paper withBorder p="md">
        <Group gap="md">
          <Select
            placeholder="Filter by academic year"
            leftSection={<IconFilter size={16} />}
            data={academicYearOptions}
            value={academicYearId || activeYear?.id || null}
            onChange={setAcademicYearId}
            clearable
            searchable
            w={250}
          />
          <Select
            placeholder="Filter by status"
            data={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
            value={isActive}
            onChange={setIsActive}
            clearable
            w={150}
          />
        </Group>
      </Paper>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={900}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th ta="right" align="right">
                  Amount
                </Table.Th>
                <Table.Th>Scope</Table.Th>
                <Table.Th>Target Periods</Table.Th>
                <Table.Th>Applied To</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th w={120}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <Table.Tr key={`skeleton-${i}`}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <Table.Td key={`skeleton-cell-${j}`}>
                        <Skeleton height={20} />
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))}
              {!isLoading && data?.discounts.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text ta="center" c="dimmed" py="md">
                      No discounts found
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {data?.discounts.map((discount) => (
                <Table.Tr key={discount.id}>
                  <Table.Td>
                    <Stack gap={0}>
                      <Text size="sm" fw={500}>
                        {discount.name}
                      </Text>
                      {discount.reason && (
                        <Text size="xs" c="dimmed">
                          {discount.reason}
                        </Text>
                      )}
                    </Stack>
                  </Table.Td>
                  <Table.Td ta="right" align="right">
                    <NumberFormatter
                      value={discount.discountAmount}
                      prefix="Rp "
                      thousandSeparator="."
                      decimalSeparator=","
                    />
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={discount.classAcademicId ? "blue" : "green"}
                      variant="light"
                    >
                      {discount.classAcademic
                        ? discount.classAcademic.className
                        : "School-wide"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {discount.targetPeriods.slice(0, 3).map((period) => (
                        <Badge key={period} size="sm" variant="outline">
                          {getPeriodDisplayName(period)}
                        </Badge>
                      ))}
                      {discount.targetPeriods.length > 3 && (
                        <Badge size="sm" variant="outline" color="gray">
                          +{discount.targetPeriods.length - 3}
                        </Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {discount._count?.tuitions || 0} tuitions
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={discount.isActive ? "green" : "gray"}
                      variant="light"
                    >
                      {discount.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="Apply to existing tuitions">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() =>
                            handleApply(discount.id, discount.name)
                          }
                          disabled={!discount.isActive}
                          loading={applyPreview.isPending}
                        >
                          <IconPlayerPlay size={18} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit">
                        <ActionIcon
                          variant="subtle"
                          onClick={() =>
                            router.push(`/discounts/${discount.id}`)
                          }
                        >
                          <IconEdit size={18} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() =>
                            handleDelete(discount.id, discount.name)
                          }
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
