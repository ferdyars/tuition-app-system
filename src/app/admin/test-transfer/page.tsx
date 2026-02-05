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
      title: "Simulasi Transfer",
      children: (
        <Stack gap="sm">
          <Text size="sm">Simulasikan transfer untuk pembayaran:</Text>
          <Card withBorder p="sm">
            <Stack gap="xs">
              <Text fw={600}>{pr.student.name}</Text>
              <Text size="sm" c="dimmed">
                NIS: {pr.student.nis}
              </Text>
              <Text size="sm">
                {pr.tuitions.map((t) => `${t.period} ${t.year}`).join(", ")}
              </Text>
              <Text size="lg" fw={700} c="blue">
                Rp {Number(pr.totalAmount).toLocaleString("id-ID")}
              </Text>
            </Stack>
          </Card>
          <Text size="xs" c="dimmed">
            Ini akan menandai pembayaran sebagai VERIFIED dan memperbarui status
            tagihan.
          </Text>
        </Stack>
      ),
      labels: { confirm: "Simulasi Transfer", cancel: "Batal" },
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
                title: "Transfer Berhasil",
                message: "Pembayaran telah diverifikasi",
                color: "green",
                icon: <IconCheck size={16} />,
              });
            },
            onError: (err) => {
              notifications.show({
                title: "Gagal",
                message:
                  err instanceof Error
                    ? err.message
                    : "Gagal memproses transfer",
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
      PENDING: { color: "yellow", label: "Menunggu" },
      VERIFIED: { color: "green", label: "Terverifikasi" },
      EXPIRED: { color: "gray", label: "Kadaluarsa" },
      CANCELLED: { color: "red", label: "Dibatalkan" },
    };
    const { color, label } = config[status] || { color: "gray", label: status };
    return <Badge color={color}>{label}</Badge>;
  };

  const isExpired = (expiresAt: string) => new Date() > new Date(expiresAt);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("id-ID", {
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
          <Title order={3}>Test Transfer</Title>
          <Text c="dimmed" size="sm">
            Simulasi transfer bank untuk testing tanpa integrasi email
          </Text>
        </div>
        <Group>
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v || "PENDING")}
            data={[
              { value: "PENDING", label: "Pending" },
              { value: "VERIFIED", label: "Verified" },
              { value: "EXPIRED", label: "Expired" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
            w={150}
          />
          <Button
            variant="light"
            leftSection={<IconRefresh size={18} />}
            onClick={() => refetch()}
            loading={loading}
          >
            Refresh
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={18} />} color="red" variant="light">
          {error instanceof Error ? error.message : "Gagal memuat data"}
        </Alert>
      )}

      <Alert icon={<IconTestPipe size={18} />} color="blue" variant="light">
        <Text size="sm">
          Halaman ini hanya untuk <strong>testing</strong>. Klik tombol
          "Simulasi Transfer" untuk menandai pembayaran sebagai berhasil tanpa
          transfer bank yang sebenarnya.
        </Text>
      </Alert>

      <Card withBorder>
        <Table.ScrollContainer minWidth={800}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Siswa</Table.Th>
                <Table.Th>Periode</Table.Th>
                <Table.Th ta="right">Nominal</Table.Th>
                <Table.Th>Dibuat</Table.Th>
                <Table.Th>Kadaluarsa</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th ta="center">Aksi</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text ta="center" py="xl" c="dimmed">
                      Memuat data...
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : paymentRequests.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text ta="center" py="xl" c="dimmed">
                      Tidak ada payment request dengan status {statusFilter}
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
                          NIS: {pr.student.nis}
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
                          Simulasi Transfer
                        </Button>
                      ) : pr.status === "VERIFIED" ? (
                        <Badge
                          color="green"
                          leftSection={<IconCheck size={12} />}
                        >
                          Verified
                        </Badge>
                      ) : (
                        <Badge
                          color="gray"
                          leftSection={<IconClock size={12} />}
                        >
                          {pr.status === "PENDING" ? "Expired" : pr.status}
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
            <Text fw={600}>Bank Accounts (untuk simulasi)</Text>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Bank</Table.Th>
                  <Table.Th>No. Rekening</Table.Th>
                  <Table.Th>Atas Nama</Table.Th>
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
