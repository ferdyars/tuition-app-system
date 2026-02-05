"use client";

import { Card, Group, SimpleGrid, Skeleton, Stack } from "@mantine/core";

export function DashboardSkeleton() {
  return (
    <Stack gap="lg">
      <Skeleton height={32} width={150} />

      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {[1, 2, 3].map((i) => (
          <Card key={i} withBorder>
            <Stack gap="xs">
              <Group gap="xs">
                <Skeleton circle height={20} width={20} />
                <Skeleton height={16} width={120} />
              </Group>
              <Skeleton height={28} width={150} />
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      {/* Pay Button */}
      <Skeleton height={48} radius="md" />

      {/* Tuitions Card */}
      <Card withBorder>
        <Stack gap="md">
          <Skeleton height={24} width={180} />
          <Stack gap="xs">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={80} radius="md" />
            ))}
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
}

export function PaymentSkeleton() {
  return (
    <Stack gap="md">
      {/* User Header */}
      <Card withBorder p="sm">
        <Group gap="sm">
          <Skeleton circle height={48} width={48} />
          <Stack gap={4} style={{ flex: 1 }}>
            <Skeleton height={16} width={150} />
            <Skeleton height={12} width={80} />
            <Skeleton height={12} width={120} />
          </Stack>
          <Skeleton circle height={36} width={36} />
        </Group>
      </Card>

      {/* Title */}
      <Skeleton height={28} width={120} />

      {/* Tuition Cards */}
      {[1, 2].map((i) => (
        <Card key={i} withBorder p="sm">
          <Stack gap="sm">
            <Group justify="space-between">
              <Skeleton height={16} width={150} />
              <Skeleton height={20} width={60} />
            </Group>
            <Stack gap="xs">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} height={60} radius="md" />
              ))}
            </Stack>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}

export function PaymentDetailSkeleton() {
  return (
    <Stack gap="md">
      {/* Header */}
      <Group gap="xs">
        <Skeleton circle height={36} width={36} />
        <Skeleton height={28} width={150} />
      </Group>

      {/* Status Banner */}
      <Skeleton height={80} radius="md" />

      {/* Student Info */}
      <Card withBorder p="sm">
        <Stack gap="xs">
          <Skeleton height={14} width={120} />
          <Skeleton height={1} />
          <SimpleGrid cols={2} spacing="xs">
            {[1, 2, 3, 4].map((i) => (
              <Stack key={i} gap={4}>
                <Skeleton height={12} width={60} />
                <Skeleton height={16} width={100} />
              </Stack>
            ))}
          </SimpleGrid>
        </Stack>
      </Card>

      {/* Amount */}
      <Card withBorder p="md">
        <Stack gap="sm" align="center">
          <Skeleton height={12} width={100} />
          <Skeleton height={36} width={200} />
          <Skeleton height={12} width={150} />
        </Stack>
      </Card>

      {/* Actions */}
      <Stack gap="xs">
        <Skeleton height={40} radius="md" />
        <Skeleton height={40} radius="md" />
      </Stack>
    </Stack>
  );
}

export function TransactionHistorySkeleton() {
  return (
    <Stack gap="sm">
      {[1, 2, 3].map((i) => (
        <Card key={i} withBorder p="sm">
          <Stack gap="xs">
            <Group justify="space-between">
              <Stack gap={4}>
                <Skeleton height={16} width={120} />
                <Skeleton height={12} width={100} />
              </Stack>
              <Skeleton height={20} width={70} />
            </Group>
            <Skeleton height={1} />
            <Group justify="space-between">
              <Stack gap={4}>
                <Skeleton height={12} width={40} />
                <Skeleton height={14} width={60} />
              </Stack>
              <Stack gap={4} align="flex-end">
                <Skeleton height={12} width={50} />
                <Skeleton height={14} width={100} />
              </Stack>
            </Group>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
