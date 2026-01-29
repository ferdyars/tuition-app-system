"use client";

import {
  ActionIcon,
  Group,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconSearch, IconTrash } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDeleteStudent, useStudents } from "@/hooks/api/useStudents";

export default function StudentTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useStudents({
    page,
    limit: 10,
    search: search || undefined,
  });

  const deleteStudent = useDeleteStudent();

  const handleDelete = (nis: string, name: string) => {
    modals.openConfirmModal({
      title: "Delete Student",
      children: (
        <Text size="sm">
          Are you sure you want to delete <strong>{name}</strong> ({nis})? This
          action cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteStudent.mutate(nis, {
          onSuccess: () => {
            notifications.show({
              title: "Deleted",
              message: "Student deleted successfully",
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
      <TextInput
        placeholder="Search by NIS, NIK, or name..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => {
          setSearch(e.currentTarget.value);
          setPage(1);
        }}
      />

      <Paper withBorder>
        <Table.ScrollContainer minWidth={700}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>NIS</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Parent</Table.Th>
                <Table.Th>Phone</Table.Th>
                <Table.Th>Join Date</Table.Th>
                <Table.Th w={100}>Actions</Table.Th>
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
              {!isLoading && data?.students.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" c="dimmed" py="md">
                      No students found
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {data?.students.map((student) => (
                <Table.Tr key={student.nis}>
                  <Table.Td>{student.nis}</Table.Td>
                  <Table.Td>{student.name}</Table.Td>
                  <Table.Td>{student.parentName}</Table.Td>
                  <Table.Td>{student.parentPhone}</Table.Td>
                  <Table.Td>
                    {dayjs(student.startJoinDate).format("DD/MM/YYYY")}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => router.push(`/students/${student.nis}`)}
                      >
                        <IconEdit size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(student.nis, student.name)}
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
