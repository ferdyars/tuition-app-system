"use client";

import {
  Badge,
  Card,
  Group,
  NumberFormatter,
  Paper,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCalendar,
  IconCash,
  IconReceipt,
  IconSchool,
  IconTrendingUp,
  IconUsers,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useDashboardStats } from "@/hooks/api/useDashboard";
import { useAuth } from "@/hooks/useAuth";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  loading,
  subtitle,
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
  subtitle?: string;
}) {
  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            {title}
          </Text>
          {loading ? (
            <Skeleton height={28} width={80} />
          ) : (
            <Title order={3}>{value}</Title>
          )}
          {subtitle && (
            <Text size="xs" c="dimmed">
              {subtitle}
            </Text>
          )}
        </Stack>
        <ThemeIcon size="lg" color={color} variant="light">
          <Icon size={20} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  const collectionRate =
    stats && stats.tuitionStats.total > 0
      ? (stats.tuitionStats.paid / stats.tuitionStats.total) * 100
      : 0;

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} mb="xs">
          Welcome, {user?.name}
        </Title>
        <Group gap="md">
          <Text c="dimmed">School Tuition Management System</Text>
          {stats?.activeAcademicYear && (
            <Badge
              leftSection={<IconCalendar size={14} />}
              variant="light"
              color="blue"
            >
              {stats.activeAcademicYear}
            </Badge>
          )}
        </Group>
      </div>

      {/* Stats Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <StatCard
          title="Total Students"
          value={stats?.totalStudents ?? 0}
          icon={IconSchool}
          color="blue"
          loading={isLoading}
        />
        <StatCard
          title="Monthly Revenue"
          value={
            <NumberFormatter
              value={stats?.monthlyRevenue ?? 0}
              prefix="Rp "
              thousandSeparator="."
              decimalSeparator=","
            />
          }
          icon={IconCash}
          color="green"
          loading={isLoading}
          subtitle={`${stats?.monthlyPaymentsCount ?? 0} payments this month`}
        />
        <StatCard
          title="Overdue Tuitions"
          value={stats?.overdueTuitions ?? 0}
          icon={IconAlertTriangle}
          color="red"
          loading={isLoading}
        />
        <StatCard
          title="Total Outstanding"
          value={
            <NumberFormatter
              value={stats?.totalOutstanding ?? 0}
              prefix="Rp "
              thousandSeparator="."
              decimalSeparator=","
            />
          }
          icon={IconTrendingUp}
          color="orange"
          loading={isLoading}
        />
      </SimpleGrid>

      {/* Collection Progress & Stats */}
      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Card withBorder>
          <Stack gap="md">
            <Text fw={600}>Collection Progress</Text>
            {isLoading ? (
              <Skeleton height={60} />
            ) : (
              <>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Overall Collection Rate
                  </Text>
                  <Text
                    fw={700}
                    c={
                      collectionRate >= 80
                        ? "green"
                        : collectionRate >= 50
                          ? "yellow"
                          : "red"
                    }
                  >
                    {collectionRate.toFixed(1)}%
                  </Text>
                </Group>
                <Progress
                  value={collectionRate}
                  color={
                    collectionRate >= 80
                      ? "green"
                      : collectionRate >= 50
                        ? "yellow"
                        : "red"
                  }
                  size="xl"
                />
                <Group justify="center" gap="xl">
                  <Group gap="xs">
                    <Badge color="green" variant="dot" />
                    <Text size="sm">Paid: {stats?.tuitionStats.paid ?? 0}</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge color="yellow" variant="dot" />
                    <Text size="sm">
                      Partial: {stats?.tuitionStats.partial ?? 0}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <Badge color="red" variant="dot" />
                    <Text size="sm">
                      Unpaid: {stats?.tuitionStats.unpaid ?? 0}
                    </Text>
                  </Group>
                </Group>
              </>
            )}
          </Stack>
        </Card>

        <Card withBorder>
          <Stack gap="md">
            <Text fw={600}>System Overview</Text>
            {isLoading ? (
              <Skeleton height={60} />
            ) : (
              <SimpleGrid cols={2}>
                <Paper withBorder p="sm" radius="sm">
                  <Group gap="xs">
                    <ThemeIcon size="sm" color="blue" variant="light">
                      <IconUsers size={14} />
                    </ThemeIcon>
                    <div>
                      <Text size="xs" c="dimmed">
                        Employees
                      </Text>
                      <Text fw={600}>{stats?.totalEmployees ?? 0}</Text>
                    </div>
                  </Group>
                </Paper>
                <Paper withBorder p="sm" radius="sm">
                  <Group gap="xs">
                    <ThemeIcon size="sm" color="teal" variant="light">
                      <IconReceipt size={14} />
                    </ThemeIcon>
                    <div>
                      <Text size="xs" c="dimmed">
                        Total Tuitions
                      </Text>
                      <Text fw={600}>{stats?.tuitionStats.total ?? 0}</Text>
                    </div>
                  </Group>
                </Paper>
              </SimpleGrid>
            )}
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Recent Payments */}
      <Card withBorder>
        <Stack gap="md">
          <Text fw={600}>Recent Payments</Text>
          {isLoading ? (
            <Stack gap="xs">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={`skeleton-${i}`} height={40} />
              ))}
            </Stack>
          ) : stats?.recentPayments && stats.recentPayments.length > 0 ? (
            <Table.ScrollContainer minWidth={700}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Student</Table.Th>
                    <Table.Th>Class</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Processed By</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {stats.recentPayments.map((payment) => (
                    <Table.Tr key={payment.id}>
                      <Table.Td>
                        <Stack gap={0}>
                          <Text size="sm" fw={500}>
                            {payment.studentName}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {payment.studentNis}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{payment.className}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500} c="green">
                          <NumberFormatter
                            value={payment.amount}
                            prefix="Rp "
                            thousandSeparator="."
                            decimalSeparator=","
                          />
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {dayjs(payment.paymentDate).format(
                            "DD/MM/YYYY HH:mm",
                          )}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{payment.processedBy}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          ) : (
            <Text c="dimmed" ta="center" py="md">
              No recent payments
            </Text>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
