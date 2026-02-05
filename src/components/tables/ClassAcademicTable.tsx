"use client";

import {
  ActionIcon,
  Badge,
  Group,
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
  IconEdit,
  IconSearch,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAcademicYears } from "@/hooks/api/useAcademicYears";
import {
  useClassAcademics,
  useDeleteClassAcademic,
} from "@/hooks/api/useClassAcademics";

export default function ClassAcademicTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState<string | null>(
    null,
  );

  const { data: academicYearsData } = useAcademicYears({ limit: 100 });

  const { data, isLoading } = useClassAcademics({
    page,
    limit: 10,
    search: search || undefined,
    academicYearId: academicYearFilter || undefined,
  });

  const deleteClass = useDeleteClassAcademic();

  const handleDelete = (id: string, className: string) => {
    modals.openConfirmModal({
      title: "Delete Class",
      children: (
        <Text size="sm">
          Are you sure you want to delete <strong>{className}</strong>? This
          action cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteClass.mutate(id, {
          onSuccess: () => {
            notifications.show({
              title: "Deleted",
              message: "Class deleted successfully",
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

  const academicYearOptions =
    academicYearsData?.academicYears.map((ay) => ({
      value: ay.id,
      label: ay.year,
    })) || [];

  return (
    <Stack gap="md">
      <Group>
        <TextInput
          placeholder="Search classes..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Filter by year"
          data={academicYearOptions}
          value={academicYearFilter}
          onChange={(value) => {
            setAcademicYearFilter(value);
            setPage(1);
          }}
          clearable
          searchable
          w={200}
        />
      </Group>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={700}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Class Name</Table.Th>
                <Table.Th>Grade</Table.Th>
                <Table.Th>Section</Table.Th>
                <Table.Th>Academic Year</Table.Th>
                <Table.Th>Students</Table.Th>
                <Table.Th w={120}>Actions</Table.Th>
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
              {!isLoading && data?.classes.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" c="dimmed" py="md">
                      No classes found
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {data?.classes.map((cls) => (
                <Table.Tr key={cls.id}>
                  <Table.Td fw={600}>{cls.className}</Table.Td>
                  <Table.Td>{cls.grade}</Table.Td>
                  <Table.Td>{cls.section}</Table.Td>
                  <Table.Td>{cls.academicYear?.year}</Table.Td>
                  <Table.Td>
                    <Badge
                      variant="light"
                      color={cls._count?.studentClasses ? "blue" : "gray"}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        router.push(`/admin/classes/${cls.id}/students`)
                      }
                    >
                      {cls._count?.studentClasses ?? 0} students
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="Manage Students">
                        <ActionIcon
                          variant="subtle"
                          color="teal"
                          onClick={() =>
                            router.push(`/admin/classes/${cls.id}/students`)
                          }
                        >
                          <IconUsers size={18} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit Class">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() =>
                            router.push(`/admin/classes/${cls.id}`)
                          }
                        >
                          <IconEdit size={18} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete Class">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(cls.id, cls.className)}
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
