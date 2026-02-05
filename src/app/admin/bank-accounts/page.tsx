"use client";

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  Skeleton,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  useBankAccounts,
  useCreateBankAccount,
  useDeleteBankAccount,
  useUpdateBankAccount,
} from "@/hooks/api/useBankAccounts";

interface BankAccount {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  logoUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  pendingPayments: number;
}

export default function BankAccountsPage() {
  const t = useTranslations();
  const { data: bankAccounts = [], isLoading, error } = useBankAccounts();
  const createBankAccount = useCreateBankAccount();
  const updateBankAccount = useUpdateBankAccount();
  const deleteBankAccount = useDeleteBankAccount();

  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      bankName: "",
      bankCode: "",
      accountNumber: "",
      accountName: "",
      logoUrl: "",
      displayOrder: 0,
      isActive: true,
    },
  });

  const handleOpenCreate = () => {
    setSelectedId(null);
    form.reset();
    openModal();
  };

  const handleOpenEdit = (bank: BankAccount) => {
    setSelectedId(bank.id);
    form.setValues({
      bankName: bank.bankName,
      bankCode: bank.bankCode,
      accountNumber: bank.accountNumber,
      accountName: bank.accountName,
      logoUrl: bank.logoUrl || "",
      displayOrder: bank.displayOrder,
      isActive: bank.isActive,
    });
    openModal();
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const payload = {
        ...values,
        logoUrl: values.logoUrl || null,
      };

      if (selectedId) {
        await updateBankAccount.mutateAsync({ id: selectedId, ...payload });
        notifications.show({
          title: t("common.success"),
          message: t("bankAccount.updateSuccess"),
          color: "green",
          icon: <IconCheck size={16} />,
        });
      } else {
        await createBankAccount.mutateAsync(payload);
        notifications.show({
          title: t("common.success"),
          message: t("bankAccount.createSuccess"),
          color: "green",
          icon: <IconCheck size={16} />,
        });
      }
      closeModal();
    } catch (err) {
      notifications.show({
        title: t("common.error"),
        message: err instanceof Error ? err.message : t("common.error"),
        color: "red",
      });
    }
  };

  const handleDelete = (bank: BankAccount) => {
    if (bank.pendingPayments > 0) {
      notifications.show({
        title: "Tidak dapat dihapus",
        message: "Bank account masih memiliki pembayaran pending",
        color: "red",
      });
      return;
    }

    modals.openConfirmModal({
      title: "Hapus Bank Account",
      children: (
        <Text size="sm">
          Bank account <strong>{bank.bankName}</strong> ({bank.accountNumber})
          akan dihapus permanen. Aksi ini tidak dapat dibatalkan.
        </Text>
      ),
      labels: { confirm: "Hapus", cancel: "Batal" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteBankAccount.mutateAsync(bank.id);
          notifications.show({
            title: "Berhasil",
            message: "Bank account berhasil dihapus",
            color: "green",
            icon: <IconCheck size={16} />,
          });
        } catch (err) {
          notifications.show({
            title: "Error",
            message: err instanceof Error ? err.message : "Gagal menghapus",
            color: "red",
          });
        }
      },
    });
  };

  const isSubmitting =
    createBankAccount.isPending || updateBankAccount.isPending;

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={3}>Bank Accounts</Title>
        <Button leftSection={<IconPlus size={18} />} onClick={handleOpenCreate}>
          Tambah Bank
        </Button>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={18} />} color="red" variant="light">
          {error instanceof Error ? error.message : "Gagal memuat data"}
        </Alert>
      )}

      <Card withBorder>
        {isLoading ? (
          <Stack gap="sm">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={60} />
            ))}
          </Stack>
        ) : bankAccounts.length === 0 ? (
          <Alert icon={<IconAlertCircle size={18} />} color="gray">
            Belum ada bank account. Tambahkan bank untuk menerima pembayaran
            transfer.
          </Alert>
        ) : (
          <Table.ScrollContainer minWidth={700}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Bank</Table.Th>
                  <Table.Th>No. Rekening</Table.Th>
                  <Table.Th>Nama Rekening</Table.Th>
                  <Table.Th>Pending</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {bankAccounts.map((bank) => (
                  <Table.Tr key={bank.id}>
                    <Table.Td>
                      <Stack gap={0}>
                        <Text fw={500}>{bank.bankName}</Text>
                        <Text size="xs" c="dimmed">
                          Kode: {bank.bankCode}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td style={{ fontFamily: "monospace" }}>
                      {bank.accountNumber}
                    </Table.Td>
                    <Table.Td>{bank.accountName}</Table.Td>
                    <Table.Td>
                      {bank.pendingPayments > 0 ? (
                        <Badge color="yellow">{bank.pendingPayments}</Badge>
                      ) : (
                        <Text c="dimmed">0</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={bank.isActive ? "green" : "gray"}
                        variant="light"
                      >
                        {bank.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => handleOpenEdit(bank)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(bank)}
                          disabled={bank.pendingPayments > 0}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={selectedId ? "Edit Bank Account" : "Tambah Bank Account"}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Nama Bank"
              placeholder="BCA, Mandiri, BNI, BRI"
              required
              {...form.getInputProps("bankName")}
            />
            <TextInput
              label="Kode Bank"
              placeholder="014, 008, 009, 002"
              required
              {...form.getInputProps("bankCode")}
            />
            <TextInput
              label="No. Rekening"
              placeholder="1234567890"
              required
              {...form.getInputProps("accountNumber")}
            />
            <TextInput
              label="Nama Rekening"
              placeholder="YAYASAN SEKOLAH XYZ"
              required
              {...form.getInputProps("accountName")}
            />
            <TextInput
              label="Logo URL (optional)"
              placeholder="/images/banks/bca.png"
              {...form.getInputProps("logoUrl")}
            />
            <NumberInput
              label="Urutan Tampilan"
              min={0}
              {...form.getInputProps("displayOrder")}
            />
            <Switch
              label="Aktif"
              {...form.getInputProps("isActive", { type: "checkbox" })}
            />

            <Group justify="flex-end">
              <Button variant="outline" onClick={closeModal}>
                Batal
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {selectedId ? "Simpan" : "Tambah"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
