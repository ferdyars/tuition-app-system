"use client";

import {
  Badge,
  Card,
  Group,
  NumberFormatter,
  Paper,
  Progress,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCash,
  IconCheck,
  IconClock,
  IconDiscount,
  IconFilter,
  IconGift,
  IconUsers,
} from "@tabler/icons-react";
import { useState } from "react";
import { useAcademicYears } from "@/hooks/api/useAcademicYears";
import { useClassSummary } from "@/hooks/api/useReports";

export default function ClassSummaryCards() {
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);

  const { data: academicYearsData } = useAcademicYears({ limit: 100 });
  const activeYear = academicYearsData?.academicYears.find((ay) => ay.isActive);

  const { data, isLoading } = useClassSummary({
    academicYearId: academicYearId || activeYear?.id,
  });

  const academicYearOptions =
    academicYearsData?.academicYears.map((ay) => ({
      value: ay.id,
      label: `${ay.year}${ay.isActive ? " (Active)" : ""}`,
    })) || [];

  // Use effective fees (after scholarships) for percentage calculation
  const overallPercentage =
    data && data.totals.totalEffectiveFees > 0
      ? (data.totals.totalPaid / data.totals.totalEffectiveFees) * 100
      : 0;

  return (
    <Stack gap="md">
      {/* Overall Summary */}
      {data && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          <Card withBorder>
            <Group>
              <ThemeIcon size="lg" color="blue" variant="light">
                <IconUsers size={20} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Total Students
                </Text>
                <Text size="xl" fw={700}>
                  {data.totals.totalStudents}
                </Text>
              </div>
            </Group>
          </Card>
          <Card withBorder>
            <Group>
              <ThemeIcon size="lg" color="green" variant="light">
                <IconCheck size={20} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Paid Tuitions
                </Text>
                <Text size="xl" fw={700} c="green">
                  {data.totals.paid}
                </Text>
              </div>
            </Group>
          </Card>
          <Card withBorder>
            <Group>
              <ThemeIcon size="lg" color="yellow" variant="light">
                <IconClock size={20} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Partial Payments
                </Text>
                <Text size="xl" fw={700} c="yellow">
                  {data.totals.partial}
                </Text>
              </div>
            </Group>
          </Card>
          <Card withBorder>
            <Group>
              <ThemeIcon size="lg" color="red" variant="light">
                <IconAlertTriangle size={20} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Unpaid Tuitions
                </Text>
                <Text size="xl" fw={700} c="red">
                  {data.totals.unpaid}
                </Text>
              </div>
            </Group>
          </Card>
        </SimpleGrid>
      )}

      {/* Overall Financial Summary */}
      {data && (
        <Card withBorder>
          <Stack gap="md">
            <Text fw={600}>Overall Payment Progress</Text>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
              <div>
                <Text size="xs" c="dimmed">
                  Total Fees
                </Text>
                <Text size="lg" fw={600}>
                  <NumberFormatter
                    value={data.totals.totalFees}
                    prefix="Rp "
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Text>
              </div>
              {data.totals.totalScholarships > 0 && (
                <div>
                  <Group gap={4}>
                    <IconGift size={14} color="var(--mantine-color-teal-6)" />
                    <Text size="xs" c="dimmed">
                      Scholarships
                    </Text>
                  </Group>
                  <Text size="lg" fw={600} c="teal">
                    -
                    <NumberFormatter
                      value={data.totals.totalScholarships}
                      prefix="Rp "
                      thousandSeparator="."
                      decimalSeparator=","
                    />
                  </Text>
                </div>
              )}

              {data.totals.totalDiscounts > 0 && (
                <div>
                  <Group gap={4}>
                    <IconDiscount
                      size={14}
                      color="var(--mantine-color-green-6)"
                    />
                    <Text size="xs" c="dimmed">
                      Discounts
                    </Text>
                  </Group>
                  <Text size="lg" fw={600} c="green">
                    -
                    <NumberFormatter
                      value={data.totals.totalDiscounts}
                      prefix="Rp "
                      thousandSeparator="."
                      decimalSeparator=","
                    />
                  </Text>
                </div>
              )}
              <div>
                <Text size="xs" c="dimmed">
                  {data.totals.totalScholarships > 0
                    ? "Net Amount Due"
                    : "Total Collected"}
                </Text>
                <Text
                  size="lg"
                  fw={600}
                  c={data.totals.totalScholarships > 0 ? "blue" : "green"}
                >
                  <NumberFormatter
                    value={
                      data.totals.totalScholarships > 0
                        ? data.totals.totalEffectiveFees
                        : data.totals.totalPaid
                    }
                    prefix="Rp "
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Total Collected
                </Text>
                <Text size="lg" fw={600} c="green">
                  <NumberFormatter
                    value={data.totals.totalPaid}
                    prefix="Rp "
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Outstanding
                </Text>
                <Text size="lg" fw={600} c="red">
                  <NumberFormatter
                    value={data.totals.totalOutstanding}
                    prefix="Rp "
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Text>
              </div>
            </SimpleGrid>
            <div>
              <Group justify="space-between" mb={4}>
                <Text size="sm" c="dimmed">
                  Collection Rate{" "}
                  {data.totals.totalScholarships > 0 && "(after scholarships)"}
                </Text>
                <Text size="sm" fw={600}>
                  {overallPercentage.toFixed(1)}%
                </Text>
              </Group>
              <Progress
                value={Math.min(overallPercentage, 100)}
                color={
                  overallPercentage >= 80
                    ? "green"
                    : overallPercentage >= 50
                      ? "yellow"
                      : "red"
                }
                size="lg"
              />
            </div>
          </Stack>
        </Card>
      )}

      {/* Filter */}
      <Paper withBorder p="md">
        <Group gap="md">
          <Select
            placeholder="Select Academic Year"
            leftSection={<IconFilter size={16} />}
            data={academicYearOptions}
            value={academicYearId}
            onChange={setAcademicYearId}
            clearable
            w={200}
          />
        </Group>
      </Paper>

      {/* Class Cards */}
      {isLoading && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={200} />
          ))}
        </SimpleGrid>
      )}

      {!isLoading && data && (
        <SimpleGrid cols={{ base: 1, lg: 2 }}>
          {data.classes.map((cls) => {
            // Use effective fees (after scholarships) for percentage
            const effectiveFees =
              cls.statistics.totalEffectiveFees || cls.statistics.totalFees;
            const paidPercentage =
              effectiveFees > 0
                ? (cls.statistics.totalPaid / effectiveFees) * 100
                : 0;
            const hasScholarship = cls.statistics.totalScholarships > 0;
            const hasDiscount = cls.statistics.totalDiscounts > 0;

            return (
              <Card key={cls.class.id} withBorder>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <Text fw={600}>{cls.class.className}</Text>
                      {hasScholarship && (
                        <ThemeIcon size="sm" color="teal" variant="light">
                          <IconGift size={12} />
                        </ThemeIcon>
                      )}
                    </Group>
                    <Badge
                      color={
                        paidPercentage >= 80
                          ? "green"
                          : paidPercentage >= 50
                            ? "yellow"
                            : "red"
                      }
                    >
                      {Math.min(paidPercentage, 100).toFixed(0)}%
                    </Badge>
                  </Group>

                  <SimpleGrid cols={2}>
                    <div>
                      <Text size="xs" c="dimmed">
                        Students
                      </Text>
                      <Text size="sm" fw={500}>
                        {cls.statistics.totalStudents}
                      </Text>
                    </div>
                    <div>
                      <Text size="xs" c="dimmed">
                        Tuitions
                      </Text>
                      <Text size="sm" fw={500}>
                        {cls.statistics.totalTuitions}
                      </Text>
                    </div>
                  </SimpleGrid>

                  <Group gap="xs" wrap="wrap">
                    <Badge color="green" variant="light" size="sm">
                      Paid: {cls.statistics.paid}
                    </Badge>
                    <Badge color="yellow" variant="light" size="sm">
                      Partial: {cls.statistics.partial}
                    </Badge>
                    <Badge color="red" variant="light" size="sm">
                      Unpaid: {cls.statistics.unpaid}
                    </Badge>
                    {hasScholarship && (
                      <Badge
                        color="teal"
                        variant="light"
                        size="sm"
                        leftSection={<IconGift size={10} />}
                      >
                        Scholarship
                      </Badge>
                    )}
                    {hasDiscount && (
                      <Badge
                        color="green"
                        variant="light"
                        size="sm"
                        leftSection={<IconDiscount size={10} />}
                      >
                        Scholarship
                      </Badge>
                    )}
                  </Group>

                  <Progress
                    value={Math.min(paidPercentage, 100)}
                    color={
                      paidPercentage >= 80
                        ? "green"
                        : paidPercentage >= 50
                          ? "yellow"
                          : "red"
                    }
                    size="sm"
                  />

                  {hasScholarship && (
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">
                        Scholarship Discount:
                      </Text>
                      <Text size="xs" fw={500} c="teal">
                        -
                        <NumberFormatter
                          value={cls.statistics.totalScholarships}
                          prefix="Rp "
                          thousandSeparator="."
                          decimalSeparator=","
                        />
                      </Text>
                    </Group>
                  )}

                  {hasDiscount && (
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">
                        Discount Discount:
                      </Text>
                      <Text size="xs" fw={500} c="green">
                        -
                        <NumberFormatter
                          value={cls.statistics.totalDiscounts}
                          prefix="Rp "
                          thousandSeparator="."
                          decimalSeparator=","
                        />
                      </Text>
                    </Group>
                  )}

                  <SimpleGrid cols={2}>
                    <div>
                      <Text size="xs" c="dimmed">
                        Collected
                      </Text>
                      <Text size="sm" fw={500} c="green">
                        <NumberFormatter
                          value={cls.statistics.totalPaid}
                          prefix="Rp "
                          thousandSeparator="."
                          decimalSeparator=","
                        />
                      </Text>
                    </div>
                    <div>
                      <Text size="xs" c="dimmed">
                        Outstanding
                      </Text>
                      <Text size="sm" fw={500} c="red">
                        <NumberFormatter
                          value={cls.statistics.totalOutstanding}
                          prefix="Rp "
                          thousandSeparator="."
                          decimalSeparator=","
                        />
                      </Text>
                    </div>
                  </SimpleGrid>
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      )}

      {!isLoading && data && data.classes.length === 0 && (
        <Paper withBorder p="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={60} color="gray" variant="light">
              <IconCash size={30} />
            </ThemeIcon>
            <Text c="dimmed">
              No class data found for the selected academic year
            </Text>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
