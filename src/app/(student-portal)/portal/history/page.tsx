"use client";

import {
  Badge,
  Card,
  Divider,
  Group,
  NumberFormatter,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { EmptyAnimation } from "@/components/ui/LottieAnimation";
import { PaymentSkeleton } from "@/components/ui/PortalSkeleton";
import { useStudentPaymentRequests } from "@/hooks/api/useStudentPaymentRequests";
import { getFrontendExpiryFromBackend } from "@/lib/business-logic/payment-timing";

export default function TransactionHistoryPage() {
  const t = useTranslations();
  const { data: paymentRequestsData, isLoading } = useStudentPaymentRequests({
    limit: 50,
  });

  const paymentRequests = (paymentRequestsData?.paymentRequests || []).map(
    (pr) => {
      if (
        getFrontendExpiryFromBackend(new Date(pr.expiresAt)) < new Date() &&
        pr.status === "PENDING"
      ) {
        pr.status = "EXPIRED";
      }
      return pr;
    },
  );

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

  const getStatusBadge = (status: string) => {
    const statusColorMap: Record<string, string> = {
      PENDING: "yellow",
      VERIFIED: "green",
      EXPIRED: "gray",
      CANCELLED: "red",
      FAILED: "red",
    };
    const color = statusColorMap[status] || "gray";
    const label = t(`payment.status.${status.toLowerCase()}` as const);
    return (
      <Badge color={color} size="sm">
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return <PaymentSkeleton />;
  }

  return (
    <Stack gap="md">
      <Title order={4}>{t("payment.history")}</Title>

      {paymentRequests.length === 0 ? (
        <EmptyAnimation message={t("payment.noHistory")} />
      ) : (
        <Stack gap="sm">
          {paymentRequests.map((payment) => {
            return (
              <Card
                key={payment.id}
                withBorder
                py="sm"
                component={Link}
                href={`/portal/payment/${payment.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Stack gap="xs">
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={500} truncate>
                        {payment.tuitions.length === 1
                          ? `${formatPeriod(payment.tuitions[0].period)} ${payment.tuitions[0].year}`
                          : t("payment.billsCount", {
                              count: payment.tuitions.length,
                            })}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {new Date(payment.createdAt).toLocaleDateString(
                          "id-ID",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </Text>
                    </Stack>
                    {getStatusBadge(payment.status)}
                  </Group>
                  <Divider />
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed">
                        {t("payment.bank")}
                      </Text>
                      <Text size="sm">
                        {payment.bankAccount?.bankName || "-"}
                      </Text>
                    </Stack>
                    <Stack gap={0} align="flex-end">
                      <Text size="xs" c="dimmed">
                        {t("payment.nominal")}
                      </Text>
                      <Text size="sm" fw={600}>
                        <NumberFormatter
                          value={Number(payment.totalAmount)}
                          prefix="Rp "
                          thousandSeparator="."
                          decimalSeparator=","
                        />
                      </Text>
                    </Stack>
                  </Group>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
