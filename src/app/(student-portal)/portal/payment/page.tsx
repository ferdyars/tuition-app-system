"use client";

import {
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  Group,
  NumberFormatter,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconCheck,
  IconClock,
  IconCopy,
  IconMoodSmile,
  IconUser,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PaymentSkeleton } from "@/components/ui/PortalSkeleton";
import { useStudentMe } from "@/hooks/api/useStudentAuth";
import { useStudentBanks } from "@/hooks/api/useStudentBanks";
import {
  useActivePaymentRequest,
  useCancelPaymentRequest,
  useCreatePaymentRequest,
} from "@/hooks/api/useStudentPaymentRequests";
import {
  type StudentTuition,
  useStudentTuitions,
} from "@/hooks/api/useStudentTuitions";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatPeriod(period: string): string {
  const periodMap: Record<string, string> = {
    JULY: "Juli",
    AUGUST: "Agustus",
    SEPTEMBER: "September",
    OCTOBER: "Oktober",
    NOVEMBER: "November",
    DECEMBER: "Desember",
    JANUARY: "Januari",
    FEBRUARY: "Februari",
    MARCH: "Maret",
    APRIL: "April",
    MAY: "Mei",
    JUNE: "Juni",
    Q1: "Kuartal 1",
    Q2: "Kuartal 2",
    Q3: "Kuartal 3",
    Q4: "Kuartal 4",
    SEM1: "Semester 1",
    SEM2: "Semester 2",
  };
  return periodMap[period] || period;
}

function groupByAcademicYear(
  tuitions: StudentTuition[],
): Record<string, StudentTuition[]> {
  return tuitions.reduce(
    (acc, tuition) => {
      const key = tuition.academicYear;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(tuition);
      return acc;
    },
    {} as Record<string, StudentTuition[]>,
  );
}

export default function StudentPaymentPage() {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "waiting">("select");
  const [selectedTuitions, setSelectedTuitions] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(300);
  const [error, setError] = useState<string | null>(null);

  const { data: user, isLoading: userLoading } = useStudentMe();
  const { data: tuitions, isLoading: tuitionsLoading } = useStudentTuitions();
  const { data: banks, isLoading: banksLoading } = useStudentBanks();
  const { data: activePayment, refetch: refetchActive } =
    useActivePaymentRequest();
  const createPayment = useCreatePaymentRequest();
  const cancelPayment = useCancelPaymentRequest();

  // Auto-switch to waiting if there's an active payment
  useEffect(() => {
    if (activePayment && step === "select") {
      setStep("waiting");
    }
  }, [activePayment, step]);

  const groupedTuitions = useMemo(() => {
    if (!tuitions) return {};
    return groupByAcademicYear(tuitions);
  }, [tuitions]);

  // Tuitions available for selection (not paid and not in pending payment)
  const selectableTuitions = useMemo(() => {
    return (
      tuitions?.filter((t) => t.status !== "PAID" && !t.pendingPaymentId) || []
    );
  }, [tuitions]);

  const unpaidTuitions = useMemo(() => {
    return tuitions?.filter((t) => t.status !== "PAID") || [];
  }, [tuitions]);

  const totalAmount = selectableTuitions
    .filter((t) => selectedTuitions.includes(t.id))
    .reduce((sum, t) => sum + t.remainingAmount, 0);

  // Countdown timer for active payment
  useEffect(() => {
    if (step !== "waiting" || !activePayment) return;

    const timer = setInterval(() => {
      const now = new Date();
      const expires = new Date(activePayment.expiresAt);
      const diff = Math.max(
        0,
        Math.floor((expires.getTime() - now.getTime()) / 1000),
      );
      setCountdown(diff);

      if (diff === 0) {
        setStep("select");
        setError("Waktu pembayaran habis. Silakan buat pembayaran baru.");
        refetchActive();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [step, activePayment, refetchActive]);

  // Poll for payment status changes
  useEffect(() => {
    if (step !== "waiting" || !activePayment) return;

    const pollInterval = setInterval(() => {
      refetchActive();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [step, activePayment, refetchActive]);

  // Check if payment was verified
  useEffect(() => {
    if (!activePayment) return;
    if (activePayment.status === "VERIFIED") {
      setStep("select");
      setSelectedTuitions([]);
      setError(null);
    }
  }, [activePayment]);

  const handleToggleTuition = (tuitionId: string) => {
    setSelectedTuitions((prev) =>
      prev.includes(tuitionId)
        ? prev.filter((id) => id !== tuitionId)
        : [...prev, tuitionId],
    );
  };

  const handleSelectAllUnpaid = () => {
    if (selectedTuitions.length === selectableTuitions.length) {
      setSelectedTuitions([]);
    } else {
      setSelectedTuitions(selectableTuitions.map((t) => t.id));
    }
  };

  const handleCreatePayment = () => {
    if (selectedTuitions.length === 0) {
      setError("Pilih minimal satu tagihan");
      return;
    }

    modals.openConfirmModal({
      title: "Konfirmasi Pembayaran",
      children: (
        <Stack gap="xs">
          <Text size="sm">
            Anda akan membuat pembayaran untuk {selectedTuitions.length} tagihan
            dengan total:
          </Text>
          <Text size="lg" fw={700} c="blue" ta="center">
            Rp {totalAmount.toLocaleString("id-ID")}
          </Text>
          <Text size="xs" c="dimmed">
            Setelah dikonfirmasi, Anda memiliki waktu 5 menit untuk
            menyelesaikan transfer.
          </Text>
        </Stack>
      ),
      labels: { confirm: "Ya, Buat Pembayaran", cancel: "Batal" },
      confirmProps: { color: "blue" },
      onConfirm: async () => {
        setError(null);
        try {
          await createPayment.mutateAsync({
            tuitionIds: selectedTuitions,
          });
          setStep("waiting");
          refetchActive();
          createPayment.resetIdempotencyKey();
          notifications.show({
            title: "Pembayaran Dibuat",
            message: "Silakan selesaikan transfer dalam waktu 5 menit",
            color: "blue",
            icon: <IconCheck size={16} />,
          });
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Gagal membuat pembayaran",
          );
        }
      },
    });
  };

  const handleCancel = () => {
    if (!activePayment) return;

    modals.openConfirmModal({
      title: "Batalkan Pembayaran?",
      children: (
        <Text size="sm">
          Apakah Anda yakin ingin membatalkan pembayaran ini? Anda dapat membuat
          pembayaran baru setelah membatalkan.
        </Text>
      ),
      labels: { confirm: "Ya, Batalkan", cancel: "Tidak" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await cancelPayment.mutateAsync(activePayment.id);
          setStep("select");
          refetchActive();
          notifications.show({
            title: "Pembayaran Dibatalkan",
            message: "Pembayaran berhasil dibatalkan",
            color: "orange",
          });
        } catch {
          setError("Gagal membatalkan pembayaran");
        }
      },
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    notifications.show({
      title: "Tersalin",
      message: `${label} berhasil disalin ke clipboard`,
      color: "green",
      icon: <IconCheck size={16} />,
      autoClose: 2000,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTuitionStatusBadge = (
    status: string,
    hasPendingPayment: boolean,
  ) => {
    if (hasPendingPayment) {
      return (
        <Badge color="blue" size="xs">
          Dalam Proses
        </Badge>
      );
    }
    const statusMap: Record<string, { color: string; label: string }> = {
      UNPAID: { color: "red", label: "Belum Bayar" },
      PARTIAL: { color: "yellow", label: "Sebagian" },
      PAID: { color: "green", label: "Lunas" },
    };
    const { color, label } = statusMap[status] || {
      color: "gray",
      label: status,
    };
    return (
      <Badge color={color} size="xs">
        {label}
      </Badge>
    );
  };

  if (tuitionsLoading || banksLoading || userLoading) {
    return <PaymentSkeleton />;
  }

  const UserHeader = () => (
    <Card withBorder p="sm" mb="md">
      <Group gap="sm">
        <Avatar size="lg" radius="xl" color="blue">
          {user ? getInitials(user.name) : <IconUser size={24} />}
        </Avatar>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} size="sm" truncate>
            {user?.name}
          </Text>
          <Text size="xs" c="dimmed">
            NIS: {user?.nis}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            Wali: {user?.parentName}
          </Text>
        </Box>
      </Group>
    </Card>
  );

  // Show success message if all paid
  if (unpaidTuitions.length === 0 && step === "select") {
    return (
      <Stack gap="md">
        <UserHeader />
        <Card withBorder p="lg" bg="green.0">
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" color="green" variant="light">
              <IconMoodSmile size={36} />
            </ThemeIcon>
            <Text size="lg" fw={600} c="green.8" ta="center">
              Selamat! Semua tagihan sudah lunas
            </Text>
            <Text size="sm" c="green.7" ta="center">
              Terima kasih telah melakukan pembayaran tepat waktu
            </Text>
          </Stack>
        </Card>
        <Button
          variant="light"
          leftSection={<IconArrowLeft size={18} />}
          onClick={() => router.push("/portal")}
          fullWidth
        >
          Kembali ke Beranda
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <UserHeader />

      <Group gap="xs" align="center">
        {step !== "select" && (
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() => setStep("select")}
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
        )}
        <Title order={4}>
          {step === "select" && "Pembayaran"}
          {step === "waiting" && "Menunggu Transfer"}
        </Title>
      </Group>

      {error && (
        <Alert
          icon={<IconAlertCircle size={18} />}
          color="red"
          variant="light"
          onClose={() => setError(null)}
          withCloseButton
        >
          {error}
        </Alert>
      )}

      {/* Step 1: Select Tuitions */}
      {step === "select" && (
        <Stack gap="md">
          {Object.entries(groupedTuitions).map(
            ([academicYear, yearTuitions]) => {
              const unpaidInYear = yearTuitions.filter(
                (t) => t.status !== "PAID",
              );
              const allPaidInYear = unpaidInYear.length === 0;

              return (
                <Card key={academicYear} withBorder p="sm">
                  <Stack gap="sm">
                    <Group justify="space-between" align="center">
                      <Group gap="xs">
                        <Text fw={600} size="sm">
                          Tahun Ajaran {academicYear}
                        </Text>
                        {allPaidInYear && (
                          <Badge color="green" size="xs">
                            Lunas
                          </Badge>
                        )}
                      </Group>
                      {(() => {
                        const selectableInYear = unpaidInYear.filter(
                          (t) => !t.pendingPaymentId,
                        );
                        if (selectableInYear.length <= 1) return null;
                        const selectableIds = selectableInYear.map((t) => t.id);
                        const allSelected = selectableIds.every((id) =>
                          selectedTuitions.includes(id),
                        );
                        return (
                          <Button
                            variant="subtle"
                            size="xs"
                            onClick={() => {
                              if (allSelected) {
                                setSelectedTuitions((prev) =>
                                  prev.filter(
                                    (id) => !selectableIds.includes(id),
                                  ),
                                );
                              } else {
                                setSelectedTuitions((prev) => [
                                  ...new Set([...prev, ...selectableIds]),
                                ]);
                              }
                            }}
                          >
                            {allSelected ? "Batal" : "Pilih Semua"}
                          </Button>
                        );
                      })()}
                    </Group>

                    <Stack gap="xs">
                      {yearTuitions.map((tuition) => {
                        const isPaid = tuition.status === "PAID";
                        const hasPendingPayment = !!tuition.pendingPaymentId;
                        const isDisabled = isPaid || hasPendingPayment;
                        const isSelected = selectedTuitions.includes(
                          tuition.id,
                        );

                        return (
                          <Paper
                            key={tuition.id}
                            withBorder
                            p="xs"
                            style={{
                              cursor: isDisabled ? "default" : "pointer",
                              opacity: isDisabled ? 0.7 : 1,
                              backgroundColor: isSelected
                                ? "var(--mantine-color-blue-0)"
                                : hasPendingPayment
                                  ? "var(--mantine-color-blue-0)"
                                  : undefined,
                            }}
                            onClick={() =>
                              !isDisabled && handleToggleTuition(tuition.id)
                            }
                          >
                            <Group
                              justify="space-between"
                              wrap="nowrap"
                              gap="xs"
                            >
                              <Group
                                gap="xs"
                                wrap="nowrap"
                                style={{ flex: 1, minWidth: 0 }}
                              >
                                {!isDisabled ? (
                                  <Checkbox
                                    checked={isSelected}
                                    onChange={() =>
                                      handleToggleTuition(tuition.id)
                                    }
                                    size="sm"
                                  />
                                ) : (
                                  <Box w={20} />
                                )}
                                <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                                  <Group gap="xs" wrap="nowrap">
                                    <Text size="sm" fw={500} truncate>
                                      {formatPeriod(tuition.period)}{" "}
                                      {tuition.year}
                                    </Text>
                                    {getTuitionStatusBadge(
                                      tuition.status,
                                      hasPendingPayment,
                                    )}
                                  </Group>
                                  <Text size="xs" c="dimmed" truncate>
                                    {tuition.className}
                                  </Text>
                                </Stack>
                              </Group>
                              <Stack
                                gap={0}
                                align="flex-end"
                                style={{ flexShrink: 0 }}
                              >
                                <Text
                                  size="sm"
                                  fw={600}
                                  c={
                                    isPaid
                                      ? "green"
                                      : hasPendingPayment
                                        ? "blue"
                                        : undefined
                                  }
                                >
                                  <NumberFormatter
                                    value={
                                      isPaid
                                        ? Number(tuition.paidAmount)
                                        : tuition.remainingAmount
                                    }
                                    prefix="Rp "
                                    thousandSeparator="."
                                    decimalSeparator=","
                                  />
                                </Text>
                                {!isPaid &&
                                  tuition.status === "PARTIAL" &&
                                  !hasPendingPayment && (
                                    <Text size="xs" c="dimmed">
                                      Dibayar: Rp{" "}
                                      {Number(
                                        tuition.paidAmount,
                                      ).toLocaleString("id-ID")}
                                    </Text>
                                  )}
                                {hasPendingPayment && (
                                  <Text size="xs" c="blue">
                                    Menunggu transfer
                                  </Text>
                                )}
                              </Stack>
                            </Group>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </Stack>
                </Card>
              );
            },
          )}

          {/* Sticky Payment Summary */}
          {selectedTuitions.length > 0 && (
            <Box
              style={{
                position: "sticky",
                bottom: 0,
                marginLeft: "-var(--mantine-spacing-md)",
                marginRight: "-var(--mantine-spacing-md)",
                marginBottom: "-var(--mantine-spacing-md)",
              }}
            >
              <Card
                withBorder
                p="sm"
                bg="blue.0"
                radius={0}
                style={{ borderLeft: 0, borderRight: 0, borderBottom: 0 }}
              >
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Stack gap={0}>
                      <Text size="sm" fw={500}>
                        Total {selectedTuitions.length} Tagihan
                      </Text>
                      {selectableTuitions.length > selectedTuitions.length && (
                        <Button
                          variant="subtle"
                          size="xs"
                          p={0}
                          h="auto"
                          onClick={handleSelectAllUnpaid}
                        >
                          Pilih Semua ({selectableTuitions.length} tagihan)
                        </Button>
                      )}
                      {selectedTuitions.length === selectableTuitions.length &&
                        selectableTuitions.length > 0 && (
                          <Button
                            variant="subtle"
                            size="xs"
                            p={0}
                            h="auto"
                            onClick={() => setSelectedTuitions([])}
                          >
                            Batal Pilih Semua
                          </Button>
                        )}
                    </Stack>
                    <Title order={4} c="blue">
                      <NumberFormatter
                        value={totalAmount}
                        prefix="Rp "
                        thousandSeparator="."
                        decimalSeparator=","
                      />
                    </Title>
                  </Group>
                  <Button
                    fullWidth
                    size="md"
                    onClick={handleCreatePayment}
                    loading={createPayment.isPending}
                  >
                    Buat Pembayaran
                  </Button>
                </Stack>
              </Card>
            </Box>
          )}
        </Stack>
      )}

      {/* Step 2: Payment Waiting */}
      {step === "waiting" && activePayment && (
        <Stack gap="sm">
          <Alert
            icon={<IconClock size={18} />}
            color={countdown < 60 ? "red" : "blue"}
            p="sm"
          >
            <Group justify="space-between">
              <Text size="sm">Selesaikan dalam</Text>
              <Badge size="lg" color={countdown < 60 ? "red" : "blue"}>
                {formatTime(countdown)}
              </Badge>
            </Group>
          </Alert>

          {/* Tuitions in this payment */}
          <Card withBorder p="sm">
            <Stack gap="xs">
              <Text size="xs" c="dimmed">
                Pembayaran untuk
              </Text>
              {activePayment.tuitions.map((t, i) => (
                <Group key={i} justify="space-between" wrap="nowrap">
                  <Text fw={500} size="sm">
                    {formatPeriod(t.period)} {t.year}
                  </Text>
                  <Text size="sm" c="dimmed">
                    <NumberFormatter
                      value={Number(t.amount)}
                      prefix="Rp "
                      thousandSeparator="."
                      decimalSeparator=","
                    />
                  </Text>
                </Group>
              ))}
            </Stack>
          </Card>

          {/* Amount Card */}
          <Card withBorder p="md">
            <Stack gap="sm" align="center">
              <Text size="xs" c="dimmed">
                Total Transfer
              </Text>
              <Title order={2} c="blue">
                <NumberFormatter
                  value={Number(activePayment.totalAmount)}
                  prefix="Rp "
                  thousandSeparator="."
                  decimalSeparator=","
                />
              </Title>
              <Text size="xs" c="dimmed">
                Rp {Number(activePayment.baseAmount).toLocaleString("id-ID")} +
                kode unik {activePayment.uniqueCode}
              </Text>
              <Button
                variant="light"
                size="sm"
                leftSection={<IconCopy size={16} />}
                onClick={() =>
                  handleCopy(activePayment.totalAmount.toString(), "Nominal")
                }
              >
                Salin Nominal
              </Button>
            </Stack>
          </Card>

          {/* Bank Options */}
          <Card withBorder p="sm">
            <Stack gap="sm">
              <Text fw={600} size="sm">
                Transfer ke salah satu rekening berikut:
              </Text>
              <Stack gap="xs">
                {banks?.map((bank) => (
                  <Paper key={bank.id} withBorder p="sm">
                    <Group justify="space-between" wrap="nowrap">
                      <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={600} size="sm">
                          {bank.bankName}
                        </Text>
                        <Text size="sm" ff="monospace">
                          {bank.accountNumber}
                        </Text>
                        <Text size="xs" c="dimmed">
                          a.n. {bank.accountName}
                        </Text>
                      </Stack>
                      <Button
                        variant="subtle"
                        size="xs"
                        onClick={() =>
                          handleCopy(
                            bank.accountNumber,
                            `No. Rekening ${bank.bankName}`,
                          )
                        }
                      >
                        Salin
                      </Button>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Stack>
          </Card>

          <Divider />

          <Alert color="yellow" variant="light" p="sm">
            <Text size="xs">
              Transfer <strong>tepat</strong> sesuai nominal di atas ke salah
              satu rekening. Pembayaran akan diverifikasi otomatis setelah
              transfer diterima.
            </Text>
          </Alert>

          {/* Sticky Cancel Button */}
          {countdown > 0 && (
            <Box
              bg="#F8F9FA"
              style={{
                position: "sticky",
                bottom: 0,
                paddingTop: "var(--mantine-spacing-sm)",
                paddingBottom: "var(--mantine-spacing-sm)",
                marginBottom: "-var(--mantine-spacing-md)",
                borderTop: "1px solid var(--mantine-color-gray-3)",
              }}
              py={24}
            >
              <Button
                variant="outline"
                color="red"
                onClick={handleCancel}
                loading={cancelPayment.isPending}
                fullWidth
              >
                Batalkan Pembayaran
              </Button>
            </Box>
          )}
        </Stack>
      )}
    </Stack>
  );
}
