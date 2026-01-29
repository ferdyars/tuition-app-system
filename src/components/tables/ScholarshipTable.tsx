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
import { IconFilter, IconTrash } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState } from "react";
import { useAcademicYears } from "@/hooks/api/useAcademicYears";
import { useClassAcademics } from "@/hooks/api/useClassAcademics";
import {
  useDeleteScholarship,
  useScholarships,
} from "@/hooks/api/useScholarships";

export default function ScholarshipTable() {
  const [page, setPage] = useState(1);
  const [classAcademicId, setClassAcademicId] = useState<string | null>(null);
  const [isFullScholarship, setIsFullScholarship] = useState<string | null>(
    null,
  );

  const { data: academicYearsData } = useAcademicYears({ limit: 100 });
  const activeYear = academicYearsData?.academicYears.find((ay) => ay.isActive);

  const { data: classesData } = useClassAcademics({
    limit: 100,
    academicYearId: activeYear?.id,
  });

  const { data, isLoading } = useScholarships({
    page,
    limit: 10,
    classAcademicId: classAcademicId || undefined,
    isFullScholarship:
      isFullScholarship === null ? undefined : isFullScholarship === "true",
  });

  const deleteScholarship = useDeleteScholarship();

  const handleDelete = (id: string, studentName: string) => {
    modals.openConfirmModal({
      title: "Delete Scholarship",
      children: (
        <Stack gap="xs">
          <Text size="sm">
            Are you sure you want to delete the scholarship for{" "}
            <strong>{studentName}</strong>?
          </Text>
          <Text size="sm" c="dimmed">
            Note: Auto-paid tuitions will not be reverted.
          </Text>
        </Stack>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteScholarship.mutate(id, {
          onSuccess: () => {
            notifications.show({
              title: "Deleted",
              message: "Scholarship deleted successfully",
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

  return (
    <Stack gap="md">
      <Paper withBorder p="md">
        <Group gap="md">
          <Select
            placeholder="Filter by class"
            leftSection={<IconFilter size={16} />}
            data={classOptions}
            value={classAcademicId}
            onChange={setClassAcademicId}
            clearable
            searchable
            w={250}
          />
          <Select
            placeholder="Filter by type"
            data={[
              { value: "true", label: "Full Scholarship" },
              { value: "false", label: "Partial Scholarship" },
            ]}
            value={isFullScholarship}
            onChange={setIsFullScholarship}
            clearable
            w={200}
          />
        </Group>
      </Paper>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={700}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Student</Table.Th>
              <Table.Th>Class</Table.Th>
              <Table.Th>Nominal</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th w={80}>Actions</Table.Th>
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
            {!isLoading && data?.scholarships.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" c="dimmed" py="md">
                    No scholarships found
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {data?.scholarships.map((scholarship) => (
              <Table.Tr key={scholarship.id}>
                <Table.Td>
                  <Stack gap={0}>
                    <Text size="sm" fw={500}>
                      {scholarship.student?.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {scholarship.studentNis}
                    </Text>
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{scholarship.classAcademic?.className}</Text>
                </Table.Td>
                <Table.Td>
                  <NumberFormatter
                    value={scholarship.nominal}
                    prefix="Rp "
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={scholarship.isFullScholarship ? "green" : "blue"}
                    variant="light"
                  >
                    {scholarship.isFullScholarship ? "Full" : "Partial"}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {dayjs(scholarship.createdAt).format("DD/MM/YYYY")}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="Delete">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() =>
                          handleDelete(
                            scholarship.id,
                            scholarship.student?.name || "",
                          )
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
