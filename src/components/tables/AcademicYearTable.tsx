"use client";

import {
  ActionIcon,
  Badge,
  Group,
  Pagination,
  Paper,
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
  IconStar,
  IconStarFilled,
  IconTrash,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useAcademicYears,
  useDeleteAcademicYear,
  useSetActiveAcademicYear,
} from "@/hooks/api/useAcademicYears";

export default function AcademicYearTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAcademicYears({ page, limit: 10 });

  const deleteAcademicYear = useDeleteAcademicYear();
  const setActive = useSetActiveAcademicYear();

  const handleDelete = (id: string, year: string) => {
    modals.openConfirmModal({
      title: "Delete Academic Year",
      children: (
        <Text size="sm">
          Are you sure you want to delete academic year <strong>{year}</strong>?
          This action cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteAcademicYear.mutate(id, {
          onSuccess: () => {
            notifications.show({
              title: "Deleted",
              message: "Academic year deleted successfully",
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

  const handleSetActive = (id: string, year: string) => {
    modals.openConfirmModal({
      title: "Set Active Academic Year",
      children: (
        <Text size="sm">
          Set <strong>{year}</strong> as the active academic year?
        </Text>
      ),
      labels: { confirm: "Set Active", cancel: "Cancel" },
      confirmProps: { color: "blue" },
      onConfirm: () => {
        setActive.mutate(id, {
          onSuccess: () => {
            notifications.show({
              title: "Updated",
              message: `${year} is now the active academic year`,
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

  return (
    <Stack gap="md">
      <Paper withBorder>
        <Table.ScrollContainer minWidth={600}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Year</Table.Th>
              <Table.Th>Start Date</Table.Th>
              <Table.Th>End Date</Table.Th>
              <Table.Th>Classes</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th w={140}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <Table.Tr key={`skeleton-${i}`}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <Table.Td key={`skeleton-cell-${j}`}>
                      <Skeleton height={20} />
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            {!isLoading && data?.academicYears.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" c="dimmed" py="md">
                    No academic years found
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {data?.academicYears.map((ay) => (
              <Table.Tr key={ay.id}>
                <Table.Td fw={600}>{ay.year}</Table.Td>
                <Table.Td>{dayjs(ay.startDate).format("DD/MM/YYYY")}</Table.Td>
                <Table.Td>{dayjs(ay.endDate).format("DD/MM/YYYY")}</Table.Td>
                <Table.Td>{ay._count?.classAcademics ?? 0}</Table.Td>
                <Table.Td>
                  {ay.isActive ? (
                    <Badge color="green" variant="light">
                      Active
                    </Badge>
                  ) : (
                    <Badge color="gray" variant="light">
                      Inactive
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label={ay.isActive ? "Active" : "Set active"}>
                      <ActionIcon
                        variant="subtle"
                        color={ay.isActive ? "yellow" : "gray"}
                        onClick={() =>
                          !ay.isActive && handleSetActive(ay.id, ay.year)
                        }
                        disabled={ay.isActive}
                      >
                        {ay.isActive ? (
                          <IconStarFilled size={18} />
                        ) : (
                          <IconStar size={18} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => router.push(`/academic-years/${ay.id}`)}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(ay.id, ay.year)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
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
