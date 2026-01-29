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
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconKey, IconSearch, IconTrash } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useDeleteEmployee,
  useEmployees,
  useResetEmployeePassword,
} from "@/hooks/api/useEmployees";

export default function EmployeeTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const { data, isLoading } = useEmployees({
    page,
    limit: 10,
    search: search || undefined,
    role: (roleFilter as "ADMIN" | "CASHIER") || undefined,
  });

  const deleteEmployee = useDeleteEmployee();
  const resetPassword = useResetEmployeePassword();

  const handleDelete = (id: string, name: string) => {
    modals.openConfirmModal({
      title: "Delete Employee",
      children: (
        <Text size="sm">
          Are you sure you want to delete <strong>{name}</strong>? This action
          cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteEmployee.mutate(id, {
          onSuccess: () => {
            notifications.show({
              title: "Deleted",
              message: "Employee deleted successfully",
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

  const handleResetPassword = (id: string, name: string) => {
    modals.openConfirmModal({
      title: "Reset Password",
      children: (
        <Text size="sm">
          Reset password for <strong>{name}</strong> to default (123456)?
        </Text>
      ),
      labels: { confirm: "Reset", cancel: "Cancel" },
      confirmProps: { color: "orange" },
      onConfirm: () => {
        resetPassword.mutate(id, {
          onSuccess: () => {
            notifications.show({
              title: "Password Reset",
              message: "Password has been reset to 123456",
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
      <Group>
        <TextInput
          placeholder="Search employees..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Filter by role"
          data={[
            { value: "ADMIN", label: "Admin" },
            { value: "CASHIER", label: "Cashier" },
          ]}
          value={roleFilter}
          onChange={(value) => {
            setRoleFilter(value);
            setPage(1);
          }}
          clearable
          w={160}
        />
      </Group>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th w={140}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <Table.Tr key={`skeleton-${i}`}>
                  <Table.Td>
                    <Skeleton height={20} />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={20} />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={20} width={80} />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={20} width={100} />
                  </Table.Td>
                </Table.Tr>
              ))}
            {!isLoading && data?.employees.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text ta="center" c="dimmed" py="md">
                    No employees found
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {data?.employees.map((employee) => (
              <Table.Tr key={employee.employeeId}>
                <Table.Td>{employee.name}</Table.Td>
                <Table.Td>{employee.email}</Table.Td>
                <Table.Td>
                  <Badge
                    color={employee.role === "ADMIN" ? "blue" : "green"}
                    variant="light"
                  >
                    {employee.role}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() =>
                        router.push(`/employees/${employee.employeeId}`)
                      }
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="orange"
                      onClick={() =>
                        handleResetPassword(employee.employeeId, employee.name)
                      }
                    >
                      <IconKey size={18} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() =>
                        handleDelete(employee.employeeId, employee.name)
                      }
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
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
