"use client";

import {
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  List,
  NumberFormatter,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconInfoCircle,
  IconReceipt,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PaymentFrequency } from "@/generated/prisma/client";
import { useAcademicYears } from "@/hooks/api/useAcademicYears";
import { useClassAcademics } from "@/hooks/api/useClassAcademics";
import { useDiscounts } from "@/hooks/api/useDiscounts";
import { useGenerateTuitions } from "@/hooks/api/useTuitions";
import { getPeriodDisplayName } from "@/lib/business-logic/tuition-generator";

interface GenerationResult {
  generated: number;
  skipped: number;
  details: {
    totalStudents: number;
    studentsWithFullYear: number;
    studentsWithPartialYear: number;
    className: string;
    academicYear: string;
    discountsApplied?: Array<{
      id: string;
      name: string;
      amount: number;
      targetPeriods: string[];
      scope: string;
    }>;
  };
}

const FREQUENCY_OPTIONS = [
  { value: "MONTHLY", label: "Monthly (12 payments/year)" },
  { value: "QUARTERLY", label: "Quarterly (4 payments/year)" },
  { value: "SEMESTER", label: "Semester (2 payments/year)" },
];

export default function TuitionGeneratorForm() {
  const router = useRouter();
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [classAcademicId, setClassAcademicId] = useState<string | null>(null);
  const [paymentFrequency, setPaymentFrequency] =
    useState<PaymentFrequency>("MONTHLY");
  const [monthlyFee, setMonthlyFee] = useState<number | string>(500000);
  const [quarterlyFee, setQuarterlyFee] = useState<number | string>("");
  const [semesterFee, setSemesterFee] = useState<number | string>("");
  const [result, setResult] = useState<GenerationResult | null>(null);

  const { data: academicYearsData, isLoading: loadingYears } = useAcademicYears(
    {
      limit: 100,
    },
  );

  const { data: classesData, isLoading: loadingClasses } = useClassAcademics({
    limit: 100,
    academicYearId: academicYearId || undefined,
  });

  const generateTuitions = useGenerateTuitions();

  // Fetch applicable discounts for the selected class
  const { data: discountsData } = useDiscounts({
    academicYearId: academicYearId || undefined,
    isActive: true,
    limit: 100,
  });

  // Filter discounts applicable to the selected class
  const applicableDiscounts = discountsData?.discounts.filter(
    (d) => !d.classAcademicId || d.classAcademicId === classAcademicId,
  );

  // Auto-select active academic year
  useState(() => {
    if (academicYearsData?.academicYears) {
      const activeYear = academicYearsData.academicYears.find(
        (ay) => ay.isActive,
      );
      if (activeYear) {
        setAcademicYearId(activeYear.id);
      }
    }
  });

  // Calculate fees
  const monthlyFeeNum = Number(monthlyFee) || 0;
  const quarterlyFeeNum = Number(quarterlyFee) || 0;
  const semesterFeeNum = Number(semesterFee) || 0;

  const defaultQuarterlyFee = monthlyFeeNum * 3;
  const defaultSemesterFee = monthlyFeeNum * 6;

  // Calculate discounts
  const quarterlyDiscount =
    quarterlyFeeNum > 0 && quarterlyFeeNum < defaultQuarterlyFee
      ? defaultQuarterlyFee - quarterlyFeeNum
      : 0;
  const semesterDiscount =
    semesterFeeNum > 0 && semesterFeeNum < defaultSemesterFee
      ? defaultSemesterFee - semesterFeeNum
      : 0;

  const quarterlyDiscountPercent =
    quarterlyDiscount > 0
      ? ((quarterlyDiscount / defaultQuarterlyFee) * 100).toFixed(1)
      : 0;
  const semesterDiscountPercent =
    semesterDiscount > 0
      ? ((semesterDiscount / defaultSemesterFee) * 100).toFixed(1)
      : 0;

  // Determine fee amount based on frequency
  const getFeeAmount = () => {
    switch (paymentFrequency) {
      case "QUARTERLY":
        return quarterlyFeeNum || defaultQuarterlyFee;
      case "SEMESTER":
        return semesterFeeNum || defaultSemesterFee;
      default:
        return monthlyFeeNum;
    }
  };

  const handleGenerate = () => {
    if (!classAcademicId || !monthlyFee) {
      notifications.show({
        title: "Validation Error",
        message: "Please select a class and enter a fee amount",
        color: "red",
      });
      return;
    }

    generateTuitions.mutate(
      {
        classAcademicId,
        feeAmount: getFeeAmount(),
        paymentFrequency,
      },
      {
        onSuccess: (data) => {
          setResult(data);
          notifications.show({
            title: "Tuitions Generated",
            message: `Successfully generated ${data.generated} tuition records`,
            color: "green",
          });
        },
        onError: (error) => {
          notifications.show({
            title: "Error",
            message: error.message,
            color: "red",
          });
        },
      },
    );
  };

  const academicYearOptions =
    academicYearsData?.academicYears.map((ay) => ({
      value: ay.id,
      label: `${ay.year}${ay.isActive ? " (Active)" : ""}`,
    })) || [];

  const classOptions =
    classesData?.classes.map((c) => ({
      value: c.id,
      label: c.className,
    })) || [];

  return (
    <Paper withBorder p="lg" maw={600}>
      <Stack gap="md">
        <Select
          label="Academic Year"
          placeholder="Select academic year"
          data={academicYearOptions}
          value={academicYearId}
          onChange={(value) => {
            setAcademicYearId(value);
            setClassAcademicId(null);
          }}
          disabled={loadingYears}
          required
        />

        <Select
          label="Class"
          placeholder="Select class"
          data={classOptions}
          value={classAcademicId}
          onChange={setClassAcademicId}
          disabled={!academicYearId || loadingClasses}
          searchable
          required
        />

        <Divider label="Payment Configuration" labelPosition="center" />

        <Select
          label="Payment Frequency"
          description="How often students pay tuition fees"
          data={FREQUENCY_OPTIONS}
          value={paymentFrequency}
          onChange={(value) =>
            setPaymentFrequency((value as PaymentFrequency) || "MONTHLY")
          }
        />

        <NumberInput
          label="Monthly Fee"
          description="Base fee per month (used to calculate quarterly/semester defaults)"
          placeholder="Enter monthly fee"
          value={monthlyFee}
          onChange={setMonthlyFee}
          min={0}
          prefix="Rp "
          thousandSeparator="."
          decimalSeparator=","
          required
        />

        {paymentFrequency === "QUARTERLY" && monthlyFeeNum > 0 && (
          <Stack gap="xs">
            <NumberInput
              label="Quarterly Fee"
              description={
                <Text size="xs" c="dimmed">
                  Default (no discount):{" "}
                  <NumberFormatter
                    value={defaultQuarterlyFee}
                    prefix="Rp "
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Text>
              }
              placeholder="Enter quarterly fee (optional for discount)"
              value={quarterlyFee}
              onChange={setQuarterlyFee}
              min={0}
              prefix="Rp "
              thousandSeparator="."
              decimalSeparator=","
            />
            {quarterlyDiscount > 0 && (
              <Alert
                icon={<IconInfoCircle size={16} />}
                color="green"
                variant="light"
              >
                <Group gap="xs">
                  <Badge color="green" variant="light">
                    Discount: {quarterlyDiscountPercent}%
                  </Badge>
                  <Text size="sm">
                    Students save{" "}
                    <NumberFormatter
                      value={quarterlyDiscount}
                      prefix="Rp "
                      thousandSeparator="."
                      decimalSeparator=","
                    />{" "}
                    per quarter
                  </Text>
                </Group>
              </Alert>
            )}
          </Stack>
        )}

        {paymentFrequency === "SEMESTER" && monthlyFeeNum > 0 && (
          <Stack gap="xs">
            <NumberInput
              label="Semester Fee"
              description={
                <Text size="xs" c="dimmed">
                  Default (no discount):{" "}
                  <NumberFormatter
                    value={defaultSemesterFee}
                    prefix="Rp "
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Text>
              }
              placeholder="Enter semester fee (optional for discount)"
              value={semesterFee}
              onChange={setSemesterFee}
              min={0}
              prefix="Rp "
              thousandSeparator="."
              decimalSeparator=","
            />
            {semesterDiscount > 0 && (
              <Alert
                icon={<IconInfoCircle size={16} />}
                color="green"
                variant="light"
              >
                <Group gap="xs">
                  <Badge color="green" variant="light">
                    Discount: {semesterDiscountPercent}%
                  </Badge>
                  <Text size="sm">
                    Students save{" "}
                    <NumberFormatter
                      value={semesterDiscount}
                      prefix="Rp "
                      thousandSeparator="."
                      decimalSeparator=","
                    />{" "}
                    per semester
                  </Text>
                </Group>
              </Alert>
            )}
          </Stack>
        )}

        {monthlyFeeNum > 0 && (
          <Alert variant="light" color="blue">
            <Text size="sm" fw={500}>
              Annual Fee Summary:
            </Text>
            <Stack gap={4} mt="xs">
              <Group justify="space-between">
                <Text size="sm">Monthly (12x):</Text>
                <Text size="sm" fw={500}>
                  <NumberFormatter
                    value={monthlyFeeNum * 12}
                    prefix="Rp "
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Quarterly (4x):</Text>
                <Text size="sm" fw={500}>
                  <NumberFormatter
                    value={(quarterlyFeeNum || defaultQuarterlyFee) * 4}
                    prefix="Rp "
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Semester (2x):</Text>
                <Text size="sm" fw={500}>
                  <NumberFormatter
                    value={(semesterFeeNum || defaultSemesterFee) * 2}
                    prefix="Rp "
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Text>
              </Group>
            </Stack>
          </Alert>
        )}

        <Alert
          icon={<IconAlertCircle size={18} />}
          color="blue"
          variant="light"
        >
          <Text size="sm">
            Tuitions will be generated for all students in the selected class.
            Students who joined mid-year will only have tuitions generated from
            their join period onwards.
          </Text>
        </Alert>

        {applicableDiscounts && applicableDiscounts.length > 0 && (
          <Alert
            icon={<IconInfoCircle size={18} />}
            color="green"
            variant="light"
            title="Discounts Will Be Applied"
          >
            <Stack gap="xs">
              <Text size="sm">
                The following discounts will be automatically applied:
              </Text>
              {applicableDiscounts.map((discount) => (
                <Group key={discount.id} gap="xs">
                  <Badge color="green" variant="light">
                    {discount.name}
                  </Badge>
                  <Text size="sm">
                    -
                    <NumberFormatter
                      value={discount.discountAmount}
                      prefix="Rp "
                      thousandSeparator="."
                      decimalSeparator=","
                    />
                  </Text>
                  <Text size="xs" c="dimmed">
                    (
                    {discount.targetPeriods
                      .slice(0, 3)
                      .map(getPeriodDisplayName)
                      .join(", ")}
                    {discount.targetPeriods.length > 3 &&
                      ` +${discount.targetPeriods.length - 3} more`}
                    )
                  </Text>
                </Group>
              ))}
            </Stack>
          </Alert>
        )}

        <Group>
          <Button
            leftSection={<IconReceipt size={18} />}
            onClick={handleGenerate}
            loading={generateTuitions.isPending}
            disabled={!classAcademicId || !monthlyFee}
          >
            Generate Tuitions
          </Button>
          <Button variant="light" onClick={() => router.push("/tuitions")}>
            View Tuitions
          </Button>
        </Group>

        {result && (
          <Alert
            icon={<IconCheck size={18} />}
            color="green"
            title="Generation Complete"
          >
            <Stack gap="xs">
              <Group gap="md">
                <Badge color="green" size="lg">
                  Generated: {result.generated}
                </Badge>
                <Badge color="gray" size="lg">
                  Skipped: {result.skipped}
                </Badge>
              </Group>
              <List size="sm">
                <List.Item>Class: {result.details.className}</List.Item>
                <List.Item>
                  Academic Year: {result.details.academicYear}
                </List.Item>
                <List.Item>
                  Total Students: {result.details.totalStudents}
                </List.Item>
                <List.Item>
                  Full Year Students: {result.details.studentsWithFullYear}
                </List.Item>
                <List.Item>
                  Mid-Year Students: {result.details.studentsWithPartialYear}
                </List.Item>
                {result.details.discountsApplied &&
                  result.details.discountsApplied.length > 0 && (
                    <List.Item>
                      Discounts Applied:{" "}
                      {result.details.discountsApplied
                        .map((d) => d.name)
                        .join(", ")}
                    </List.Item>
                  )}
              </List>
            </Stack>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
