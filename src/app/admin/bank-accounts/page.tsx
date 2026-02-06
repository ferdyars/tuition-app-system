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
        title: t("bankAccount.cannotDelete"),
        message: t("bankAccount.cannotDeleteMessage"),
        color: "red",
      });
      return;
    }

    modals.openConfirmModal({
      title: t("common.delete"),
      children: (
        <Text size="sm">
          {t.rich("bankAccount.deleteMessage", {
            bankName: bank.bankName,
            accountNumber: bank.accountNumber,
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </Text>
      ),
      labels: { confirm: t("common.delete"), cancel: t("common.cancel") },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteBankAccount.mutateAsync(bank.id);
          notifications.show({
            title: t("common.success"),
            message: t("bankAccount.deleteSuccess"),
            color: "green",
            icon: <IconCheck size={16} />,
          });
        } catch (err) {
          notifications.show({
            title: t("common.error"),
            message: err instanceof Error ? err.message : t("common.error"),
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
        <Title order={3}>{t("bankAccount.title")}</Title>
        <Button leftSection={<IconPlus size={18} />} onClick={handleOpenCreate}>
          {t("bankAccount.add")}
        </Button>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={18} />} color="red" variant="light">
          {error instanceof Error ? error.message : t("common.error")}
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
            {t("bankAccount.noData")}
          </Alert>
        ) : (
          <Table.ScrollContainer minWidth={700}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("bankAccount.bankName")}</Table.Th>
                  <Table.Th>{t("bankAccount.accountNumber")}</Table.Th>
                  <Table.Th>{t("bankAccount.accountName")}</Table.Th>
                  <Table.Th>{t("bankAccount.pending")}</Table.Th>
                  <Table.Th>{t("common.status")}</Table.Th>
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
                          {t("bankAccount.bankCode")}: {bank.bankCode}
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
                        {bank.isActive
                          ? t("bankAccount.status.active")
                          : t("bankAccount.status.inactive")}
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
        title={selectedId ? t("bankAccount.edit") : t("bankAccount.add")}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label={t("bankAccount.bankName")}
              placeholder="BCA, Mandiri, BNI, BRI"
              required
              {...form.getInputProps("bankName")}
            />
            <TextInput
              label={t("bankAccount.bankCode")}
              placeholder="014, 008, 009, 002"
              required
              {...form.getInputProps("bankCode")}
            />
            <TextInput
              label={t("bankAccount.accountNumber")}
              placeholder="1234567890"
              required
              {...form.getInputProps("accountNumber")}
            />
            <TextInput
              label={t("bankAccount.accountName")}
              placeholder="YAYASAN SEKOLAH XYZ"
              required
              {...form.getInputProps("accountName")}
            />
            <TextInput
              label={t("bankAccount.logoUrl")}
              placeholder="/images/banks/bca.png"
              {...form.getInputProps("logoUrl")}
            />
            <NumberInput
              label={t("bankAccount.displayOrder")}
              min={0}
              {...form.getInputProps("displayOrder")}
            />
            <Switch
              label={t("bankAccount.isActive")}
              {...form.getInputProps("isActive", { type: "checkbox" })}
            />

            <Group justify="flex-end">
              <Button variant="outline" onClick={closeModal}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {t("common.save")}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
