"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  NumberFormatter,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconRefresh,
  IconTestPipe,
} from "@tabler/icons-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import {
  useSimulateTransfer,
  useTestTransferData,
} from "@/hooks/api/useTestTransfer";

interface PaymentRequest {
  id: string;
  status: string;
  totalAmount: string;
  baseAmount: string;
  uniqueCode: number;
  expiresAt: string;
  createdAt: string;
  student: {
    nis: string;
    name: string;
    parentName: string;
  };
  tuitions: {
    period: string;
    year: number;
    amount: string;
  }[];
  bankAccount: {
    id: string;
    bankName: string;
    accountNumber: string;
  } | null;
}

export default function TestTransferPage() {
  const t = useTranslations();
  const format = useFormatter();
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");

  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useTestTransferData(statusFilter);

  const simulateTransfer = useSimulateTransfer();

  const paymentRequests = data?.paymentRequests || [];
  const bankAccounts = data?.bankAccounts || [];

  const handleSimulateTransfer = (pr: PaymentRequest) => {
    modals.openConfirmModal({
      title: t("testTransfer.confirmTitle"),
      children: (
        <Stack gap="sm">
          <Text size="sm">{t("testTransfer.confirmDesc")}</Text>
          <Card withBorder p="sm">
            <Stack gap="xs">
              <Text fw={600}>{pr.student.name}</Text>
              <Text size="sm" c="dimmed">
                {t("student.nis")}: {pr.student.nis}
              </Text>
              <Text size="sm">
                {pr.tuitions.map((t) => `${t.period} ${t.year}`).join(", ")}
              </Text>
              <Text size="lg" fw={700} c="blue">
                <NumberFormatter
                  value={Number(pr.totalAmount)}
                  prefix="Rp "
                  thousandSeparator="."
                  decimalSeparator=","
                />
              </Text>
            </Stack>
          </Card>
          <Text size="xs" c="dimmed">
            {t("testTransfer.confirmNote")}
          </Text>
        </Stack>
      ),
      labels: {
        confirm: t("testTransfer.confirm"),
        cancel: t("common.cancel"),
      },
      confirmProps: { color: "green" },
      onConfirm: () => {
        simulateTransfer.mutate(
          {
            paymentRequestId: pr.id,
            bankAccountId: bankAccounts[0]?.id,
          },
          {
            onSuccess: () => {
              notifications.show({
                title: t("testTransfer.successTitle"),
                message: t("testTransfer.successMessage"),
                color: "green",
                icon: <IconCheck size={16} />,
              });
            },
            onError: (err) => {
              notifications.show({
                title: t("testTransfer.errorTitle"),
                message:
                  err instanceof Error
                    ? err.message
                    : t("testTransfer.errorMessage"),
                color: "red",
              });
            },
          },
        );
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      PENDING: { color: "yellow", label: t("testTransfer.status.pending") },
      VERIFIED: { color: "green", label: t("testTransfer.status.verified") },
      EXPIRED: { color: "gray", label: t("testTransfer.status.expired") },
      CANCELLED: { color: "red", label: t("testTransfer.status.cancelled") },
    };
    const { color, label } = config[status] || { color: "gray", label: status };
    return <Badge color={color}>{label}</Badge>;
  };

  const isExpired = (expiresAt: string) => new Date() > new Date(expiresAt);

  const formatDate = (date: string) => {
    return format.dateTime(new Date(date), {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <div>
          <Title order={3}>{t("testTransfer.title")}</Title>
          <Text c="dimmed" size="sm">
            {t("testTransfer.subtitle")}
          </Text>
        </div>
        <Group>
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v || "PENDING")}
            data={[
              { value: "PENDING", label: t("testTransfer.status.pending") },
              { value: "VERIFIED", label: t("testTransfer.status.verified") },
              { value: "EXPIRED", label: t("testTransfer.status.expired") },
              { value: "CANCELLED", label: t("testTransfer.status.cancelled") },
            ]}
            w={150}
          />
          <Button
            variant="light"
            leftSection={<IconRefresh size={18} />}
            onClick={() => refetch()}
            loading={loading}
          >
            {t("testTransfer.refresh")}
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={18} />} color="red" variant="light">
          {error instanceof Error ? error.message : t("common.error")}
        </Alert>
      )}

      <Alert icon={<IconTestPipe size={18} />} color="blue" variant="light">
        <Text size="sm">
          {t.rich("testTransfer.testingNote", {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </Text>
      </Alert>

      <Card withBorder>
        <Table.ScrollContainer minWidth={800}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("testTransfer.table.student")}</Table.Th>
                <Table.Th>{t("testTransfer.table.period")}</Table.Th>
                <Table.Th ta="right">{t("testTransfer.table.amount")}</Table.Th>
                <Table.Th>{t("testTransfer.table.created")}</Table.Th>
                <Table.Th>{t("testTransfer.table.expires")}</Table.Th>
                <Table.Th>{t("testTransfer.table.status")}</Table.Th>
                <Table.Th ta="center">
                  {t("testTransfer.table.action")}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text ta="center" py="xl" c="dimmed">
                      {t("testTransfer.loading")}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : paymentRequests.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text ta="center" py="xl" c="dimmed">
                      {t("testTransfer.noPayments", { status: statusFilter })}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paymentRequests.map((pr) => (
                  <Table.Tr key={pr.id}>
                    <Table.Td>
                      <Stack gap={0}>
                        <Text fw={500} size="sm">
                          {pr.student.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {t("student.nis")}: {pr.student.nis}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={0}>
                        {pr.tuitions.map((t, i) => (
                          <Text key={i} size="sm">
                            {t.period} {t.year}
                          </Text>
                        ))}
                      </Stack>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Stack gap={0} align="flex-end">
                        <NumberFormatter
                          value={Number(pr.totalAmount)}
                          prefix="Rp "
                          thousandSeparator="."
                          decimalSeparator=","
                        />
                        <Text size="xs" c="dimmed">
                          +{pr.uniqueCode}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDate(pr.createdAt)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={0}>
                        <Text size="sm">{formatDate(pr.expiresAt)}</Text>
                        {pr.status === "PENDING" && isExpired(pr.expiresAt) && (
                          <Badge color="red" size="xs">
                            Expired
                          </Badge>
                        )}
                      </Stack>
                    </Table.Td>
                    <Table.Td>{getStatusBadge(pr.status)}</Table.Td>
                    <Table.Td ta="center">
                      {pr.status === "PENDING" && !isExpired(pr.expiresAt) ? (
                        <Button
                          size="xs"
                          color="green"
                          leftSection={<IconCheck size={14} />}
                          onClick={() => handleSimulateTransfer(pr)}
                          loading={simulateTransfer.isPending}
                        >
                          {t("testTransfer.simulateTransfer")}
                        </Button>
                      ) : pr.status === "VERIFIED" ? (
                        <Badge
                          color="green"
                          leftSection={<IconCheck size={12} />}
                        >
                          {t("testTransfer.status.verified")}
                        </Badge>
                      ) : (
                        <Badge
                          color="gray"
                          leftSection={<IconClock size={12} />}
                        >
                          {pr.status === "PENDING"
                            ? t("testTransfer.status.expired")
                            : t(
                                `testTransfer.status.${pr.status.toLowerCase()}`,
                              ) || pr.status}
                        </Badge>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      {bankAccounts.length > 0 && (
        <Card withBorder>
          <Stack gap="sm">
            <Text fw={600}>{t("testTransfer.bankAccounts")}</Text>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("testTransfer.bankTable.bank")}</Table.Th>
                  <Table.Th>
                    {t("testTransfer.bankTable.accountNumber")}
                  </Table.Th>
                  <Table.Th>{t("testTransfer.bankTable.accountName")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {bankAccounts.map((ba) => (
                  <Table.Tr key={ba.id}>
                    <Table.Td>{ba.bankName}</Table.Td>
                    <Table.Td ff="monospace">{ba.accountNumber}</Table.Td>
                    <Table.Td>{ba.accountName}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
