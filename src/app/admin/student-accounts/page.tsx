"use client";

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Menu,
  Pagination,
  Skeleton,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconDotsVertical,
  IconKey,
  IconRefresh,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  useDeleteStudentAccount,
  useResetStudentPassword,
  useRestoreStudentAccount,
  useStudentAccounts,
} from "@/hooks/api/useStudentAccounts";

interface StudentAccount {
  nis: string;
  name: string;
  parentName: string;
  parentPhone: string;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  lastPaymentAt: string | null;
  accountCreatedAt: string | null;
  accountDeleted: boolean;
  accountDeletedAt: string | null;
  accountDeletedReason: string | null;
}

export default function StudentAccountsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useStudentAccounts({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    includeDeleted,
  });

  const resetPassword = useResetStudentPassword();
  const deleteAccount = useDeleteStudentAccount();
  const restoreAccount = useRestoreStudentAccount();

  const accounts = data?.students || [];
  const totalPages = data?.pagination.totalPages || 1;

  const handleResetPassword = (account: StudentAccount) => {
    modals.openConfirmModal({
      title: "Reset Password",
      children: (
        <Text size="sm">
          Password untuk <strong>{account.name}</strong> (NIS: {account.nis})
          akan direset ke nomor HP orang tua. Student perlu login ulang dengan
          password baru.
        </Text>
      ),
      labels: { confirm: "Reset Password", cancel: "Batal" },
      onConfirm: async () => {
        try {
          const result = await resetPassword.mutateAsync(account.nis);
          notifications.show({
            title: "Password Direset",
            message: `Password baru: ${result.newPassword}`,
            color: "green",
            icon: <IconCheck size={16} />,
            autoClose: 10000,
          });
        } catch (err) {
          notifications.show({
            title: "Error",
            message: err instanceof Error ? err.message : "Gagal reset password",
            color: "red",
          });
        }
      },
    });
  };

  const handleDeleteAccount = (account: StudentAccount) => {
    modals.openConfirmModal({
      title: "Hapus Akun",
      children: (
        <Text size="sm">
          Akun <strong>{account.name}</strong> (NIS: {account.nis}) akan
          di-soft delete. Student tidak dapat login sampai akun dipulihkan.
        </Text>
      ),
      labels: { confirm: "Hapus Akun", cancel: "Batal" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteAccount.mutateAsync({
            nis: account.nis,
            reason: "Manual deletion by admin",
          });
          notifications.show({
            title: "Berhasil",
            message: "Akun berhasil dihapus",
            color: "green",
            icon: <IconCheck size={16} />,
          });
        } catch (err) {
          notifications.show({
            title: "Error",
            message: err instanceof Error ? err.message : "Gagal menghapus akun",
            color: "red",
          });
        }
      },
    });
  };

  const handleRestoreAccount = async (account: StudentAccount) => {
    try {
      await restoreAccount.mutateAsync(account.nis);
      notifications.show({
        title: "Berhasil",
        message: `Akun ${account.name} berhasil dipulihkan`,
        color: "green",
        icon: <IconCheck size={16} />,
      });
    } catch (err) {
      notifications.show({
        title: "Error",
        message: err instanceof Error ? err.message : "Gagal memulihkan akun",
        color: "red",
      });
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={3}>Student Accounts</Title>
        <Button
          leftSection={<IconRefresh size={18} />}
          variant="outline"
          onClick={() => refetch()}
          loading={isLoading}
        >
          Refresh
        </Button>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={18} />} color="red" variant="light">
          {error instanceof Error ? error.message : "Gagal memuat data"}
        </Alert>
      )}

      <Card withBorder>
        <Stack gap="md">
          <Group>
            <TextInput
              placeholder="Cari NIS, nama, atau orang tua..."
              leftSection={<IconSearch size={18} />}
              value={search}
              onChange={(e) => {
                setSearch(e.currentTarget.value);
                setPage(1);
              }}
              style={{ flex: 1 }}
            />
            <Switch
              label="Tampilkan yang dihapus"
              checked={includeDeleted}
              onChange={(e) => {
                setIncludeDeleted(e.currentTarget.checked);
                setPage(1);
              }}
            />
          </Group>

          {isLoading ? (
            <Stack gap="sm">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} height={50} />
              ))}
            </Stack>
          ) : accounts.length === 0 ? (
            <Alert icon={<IconAlertCircle size={18} />} color="gray">
              Tidak ada akun student ditemukan
            </Alert>
          ) : (
            <>
              <Table.ScrollContainer minWidth={800}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>NIS</Table.Th>
                      <Table.Th>Nama</Table.Th>
                      <Table.Th>Orang Tua</Table.Th>
                      <Table.Th>No. HP</Table.Th>
                      <Table.Th>Last Login</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {accounts.map((account) => (
                      <Table.Tr key={account.nis}>
                        <Table.Td>
                          <Text fw={500}>{account.nis}</Text>
                        </Table.Td>
                        <Table.Td>{account.name}</Table.Td>
                        <Table.Td>{account.parentName}</Table.Td>
                        <Table.Td>{account.parentPhone}</Table.Td>
                        <Table.Td>
                          {account.lastLoginAt
                            ? dayjs(account.lastLoginAt).format("DD/MM/YY HH:mm")
                            : "-"}
                        </Table.Td>
                        <Table.Td>
                          {account.accountDeleted ? (
                            <Badge color="red" variant="light">
                              Dihapus
                            </Badge>
                          ) : account.mustChangePassword ? (
                            <Badge color="yellow" variant="light">
                              Perlu Ganti Password
                            </Badge>
                          ) : (
                            <Badge color="green" variant="light">
                              Aktif
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Menu position="bottom-end">
                            <Menu.Target>
                              <ActionIcon variant="subtle">
                                <IconDotsVertical size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              {account.accountDeleted ? (
                                <Menu.Item
                                  onClick={() => handleRestoreAccount(account)}
                                  disabled={restoreAccount.isPending}
                                >
                                  Pulihkan Akun
                                </Menu.Item>
                              ) : (
                                <>
                                  <Menu.Item
                                    leftSection={<IconKey size={14} />}
                                    onClick={() => handleResetPassword(account)}
                                    disabled={resetPassword.isPending}
                                  >
                                    Reset Password
                                  </Menu.Item>
                                  <Menu.Item
                                    leftSection={<IconTrash size={14} />}
                                    color="red"
                                    onClick={() => handleDeleteAccount(account)}
                                    disabled={deleteAccount.isPending}
                                  >
                                    Hapus Akun
                                  </Menu.Item>
                                </>
                              )}
                            </Menu.Dropdown>
                          </Menu>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>

              <Group justify="center">
                <Pagination value={page} onChange={setPage} total={totalPages} />
              </Group>
            </>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
