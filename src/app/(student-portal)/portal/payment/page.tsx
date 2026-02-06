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
import { useTranslations } from "next-intl";
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
  const t = useTranslations();
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

  const formatPeriod = (period: string): string => {
    // Check months first
    const monthKey = `months.${period}` as const;
    const monthTranslation = t.raw(monthKey);
    if (monthTranslation !== monthKey) {
      return monthTranslation as string;
    }
    // Check periods (Q1, Q2, SEM1, etc.)
    const periodKey = `periods.${period}` as const;
    const periodTranslation = t.raw(periodKey);
    if (periodTranslation !== periodKey) {
      return periodTranslation as string;
    }
    return period;
  };

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
        setError(t("payment.paymentExpiredDesc"));
        refetchActive();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [step, activePayment, refetchActive, t]);

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
      setError(t("payment.selectMinOne"));
      return;
    }

    modals.openConfirmModal({
      title: t("payment.confirmPayment"),
      children: (
        <Stack gap="xs">
          <Text size="sm">
            {t("payment.willCreatePayment", {
              count: selectedTuitions.length,
            })}
          </Text>
          <Text size="lg" fw={700} c="blue" ta="center">
            Rp {totalAmount.toLocaleString("id-ID")}
          </Text>
          <Text size="xs" c="dimmed">
            {t("payment.afterConfirm")}
          </Text>
        </Stack>
      ),
      labels: {
        confirm: t("payment.yesCreate"),
        cancel: t("common.cancel"),
      },
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
            title: t("payment.paymentCreated"),
            message: t("payment.completeTransferTime"),
            color: "blue",
            icon: <IconCheck size={16} />,
          });
        } catch (err) {
          setError(
            err instanceof Error ? err.message : t("payment.failedCreate"),
          );
        }
      },
    });
  };

  const handleCancel = () => {
    if (!activePayment) return;

    modals.openConfirmModal({
      title: t("payment.cancelConfirmTitle"),
      children: <Text size="sm">{t("payment.cancelConfirmDesc")}</Text>,
      labels: {
        confirm: t("payment.yesCancel"),
        cancel: t("common.no"),
      },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await cancelPayment.mutateAsync(activePayment.id);
          setStep("select");
          refetchActive();
          notifications.show({
            title: t("payment.paymentCancelled"),
            message: t("payment.cancelledSuccess"),
            color: "orange",
          });
        } catch {
          setError(t("payment.failedCancel"));
        }
      },
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    notifications.show({
      title: t("payment.copiedTitle"),
      message: t("payment.copiedToClipboard", { label }),
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
          {t("payment.inProcess")}
        </Badge>
      );
    }
    const statusMap: Record<string, { color: string; label: string }> = {
      UNPAID: { color: "red", label: t("tuition.status.unpaid") },
      PARTIAL: { color: "yellow", label: t("tuition.status.partial") },
      PAID: { color: "green", label: t("tuition.status.paid") },
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
            {t("payment.guardian")} {user?.parentName}
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
              {t("payment.allPaid.title")}
            </Text>
            <Text size="sm" c="green.7" ta="center">
              {t("payment.allPaid.message")}
            </Text>
          </Stack>
        </Card>
        <Button
          variant="light"
          leftSection={<IconArrowLeft size={18} />}
          onClick={() => router.push("/portal")}
          fullWidth
        >
          {t("payment.backToHome")}
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
          {step === "select" && t("payment.title")}
          {step === "waiting" && t("payment.waiting")}
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
                          {t("dashboard.academicYear", {
                            year: academicYear,
                          })}
                        </Text>
                        {allPaidInYear && (
                          <Badge color="green" size="xs">
                            {t("payment.paidBadge")}
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
                            {allSelected
                              ? t("common.cancel")
                              : t("payment.selectAll")}
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
                                      {t("payment.paidLabel")} Rp{" "}
                                      {Number(
                                        tuition.paidAmount,
                                      ).toLocaleString("id-ID")}
                                    </Text>
                                  )}
                                {hasPendingPayment && (
                                  <Text size="xs" c="blue">
                                    {t("payment.waitingTransfer")}
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
                        {t("payment.totalSelected", {
                          count: selectedTuitions.length,
                        })}
                      </Text>
                      {selectableTuitions.length > selectedTuitions.length && (
                        <Button
                          variant="subtle"
                          size="xs"
                          p={0}
                          h="auto"
                          onClick={handleSelectAllUnpaid}
                        >
                          {t("payment.selectAllCount", {
                            count: selectableTuitions.length,
                          })}
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
                            {t("payment.deselectAll")}
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
                    {t("payment.createPayment")}
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
              <Text size="sm">{t("payment.completeIn")}</Text>
              <Badge size="lg" color={countdown < 60 ? "red" : "blue"}>
                {formatTime(countdown)}
              </Badge>
            </Group>
          </Alert>

          {/* Tuitions in this payment */}
          <Card withBorder p="sm">
            <Stack gap="xs">
              <Text size="xs" c="dimmed">
                {t("payment.paymentFor")}
              </Text>
              {activePayment.tuitions.map((t_item, i) => (
                <Group key={i} justify="space-between" wrap="nowrap">
                  <Text fw={500} size="sm">
                    {formatPeriod(t_item.period)} {t_item.year}
                  </Text>
                  <Text size="sm" c="dimmed">
                    <NumberFormatter
                      value={Number(t_item.amount)}
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
                {t("payment.totalTransfer")}
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
                Rp {Number(activePayment.baseAmount).toLocaleString("id-ID")} +{" "}
                {t("payment.uniqueCode")} {activePayment.uniqueCode}
              </Text>
              <Button
                variant="light"
                size="sm"
                leftSection={<IconCopy size={16} />}
                onClick={() =>
                  handleCopy(
                    activePayment.totalAmount.toString(),
                    t("payment.nominal"),
                  )
                }
              >
                {t("payment.copyAmount")}
              </Button>
            </Stack>
          </Card>

          {/* Bank Options */}
          <Card withBorder p="sm">
            <Stack gap="sm">
              <Text fw={600} size="sm">
                {t("payment.transferTo")}
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
                          {t("payment.accountHolder")} {bank.accountName}
                        </Text>
                      </Stack>
                      <Button
                        variant="subtle"
                        size="xs"
                        onClick={() =>
                          handleCopy(
                            bank.accountNumber,
                            t("payment.accountNoLabel", {
                              bank: bank.bankName,
                            }),
                          )
                        }
                      >
                        {t("payment.copy")}
                      </Button>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Stack>
          </Card>

          <Divider />

          <Alert color="yellow" variant="light" p="sm">
            <Text size="xs">{t("payment.transferExact")}</Text>
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
                {t("payment.cancelPayment")}
              </Button>
            </Box>
          )}
        </Stack>
      )}
    </Stack>
  );
}
