"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  NumberFormatter,
  NumberInput,
  Paper,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCash,
  IconCheck,
  IconGift,
  IconReceipt,
  IconUser,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { PaymentStatus } from "@/generated/prisma/client";
import { useCreatePayment } from "@/hooks/api/usePayments";
import { useStudents } from "@/hooks/api/useStudents";
import { useTuitions } from "@/hooks/api/useTuitions";
import { getMonthDisplayName } from "@/lib/business-logic/tuition-generator";

interface PaymentResult {
  payment: {
    id: string;
    amount: string;
  };
  result: {
    previousStatus: PaymentStatus;
    newStatus: PaymentStatus;
    previousPaidAmount: number;
    newPaidAmount: number;
    remainingAmount: number;
    feeAmount: number;
  };
}

export default function PaymentForm() {
  const router = useRouter();
  const [studentNis, setStudentNis] = useState<string | null>(null);
  const [tuitionId, setTuitionId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | string>("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<PaymentResult | null>(null);

  const { data: studentsData, isLoading: loadingStudents } = useStudents({
    limit: 1000,
  });

  const { data: tuitionsData, isLoading: loadingTuitions } = useTuitions({
    limit: 100,
    studentNis: studentNis || undefined,
    status: undefined, // Get all statuses, we'll filter in UI
  });

  const createPayment = useCreatePayment();

  // Filter to only show unpaid/partial tuitions
  const unpaidTuitions = useMemo(() => {
    if (!tuitionsData?.tuitions) return [];
    return tuitionsData.tuitions.filter(
      (t) => t.status === "UNPAID" || t.status === "PARTIAL",
    );
  }, [tuitionsData]);

  // Get selected tuition details
  const selectedTuition = useMemo(() => {
    if (!tuitionId || !tuitionsData?.tuitions) return null;
    return tuitionsData.tuitions.find((t) => t.id === tuitionId);
  }, [tuitionId, tuitionsData]);

  const remainingAmount = useMemo(() => {
    if (!selectedTuition) return 0;
    return (
      Number(selectedTuition.feeAmount) - Number(selectedTuition.paidAmount)
    );
  }, [selectedTuition]);

  const handleSubmit = () => {
    if (!tuitionId || !amount) {
      notifications.show({
        title: "Validation Error",
        message: "Please select a tuition and enter an amount",
        color: "red",
      });
      return;
    }

    createPayment.mutate(
      {
        tuitionId,
        amount: Number(amount),
        notes: notes || undefined,
      },
      {
        onSuccess: (data) => {
          setResult(data);
          notifications.show({
            title: "Payment Successful",
            message: `Payment of Rp ${Number(amount).toLocaleString("id-ID")} processed`,
            color: "green",
          });
          // Reset form for next payment
          setTuitionId(null);
          setAmount("");
          setNotes("");
        },
        onError: (error) => {
          notifications.show({
            title: "Payment Failed",
            message: error.message,
            color: "red",
          });
        },
      },
    );
  };

  const handlePayFull = () => {
    if (remainingAmount > 0) {
      setAmount(remainingAmount);
    }
  };

  const studentOptions =
    studentsData?.students.map((s) => ({
      value: s.nis,
      label: `${s.nis} - ${s.name}`,
    })) || [];

  const tuitionOptions = unpaidTuitions.map((t) => ({
    value: t.id,
    label: `${getMonthDisplayName(t.month)} ${t.year} - ${t.classAcademic?.className} (${t.status})`,
  }));

  const paidPercentage = selectedTuition
    ? (Number(selectedTuition.paidAmount) / Number(selectedTuition.feeAmount)) *
      100
    : 0;

  return (
    <Paper withBorder p="lg" maw={700}>
      <Stack gap="md">
        <Select
          label="Select Student"
          placeholder="Search student by NIS or name"
          leftSection={<IconUser size={18} />}
          data={studentOptions}
          value={studentNis}
          onChange={(value) => {
            setStudentNis(value);
            setTuitionId(null);
            setResult(null);
          }}
          disabled={loadingStudents}
          searchable
          required
        />

        {studentNis && (
          <Select
            label="Select Tuition"
            placeholder="Select unpaid tuition"
            leftSection={<IconReceipt size={18} />}
            data={tuitionOptions}
            value={tuitionId}
            onChange={(value) => {
              setTuitionId(value);
              setAmount("");
              setResult(null);
            }}
            disabled={loadingTuitions || unpaidTuitions.length === 0}
            searchable
            required
          />
        )}

        {unpaidTuitions.length === 0 && studentNis && !loadingTuitions && (
          <Alert icon={<IconCheck size={18} />} color="green" variant="light">
            <Text size="sm">
              This student has no unpaid tuitions. All payments are complete!
            </Text>
          </Alert>
        )}

        {selectedTuition && (
          <Card withBorder>
            <Stack gap="sm">
              <Text size="sm" fw={600}>
                Tuition Details
              </Text>
              <SimpleGrid cols={2}>
                <div>
                  <Text size="xs" c="dimmed">
                    Class
                  </Text>
                  <Text size="sm">
                    {selectedTuition.classAcademic?.className}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    Month
                  </Text>
                  <Text size="sm">
                    {getMonthDisplayName(selectedTuition.month)}{" "}
                    {selectedTuition.year}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    Fee Amount
                  </Text>
                  <Text size="sm" fw={600}>
                    <NumberFormatter
                      value={selectedTuition.feeAmount}
                      prefix="Rp "
                      thousandSeparator="."
                      decimalSeparator=","
                    />
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    Already Paid
                  </Text>
                  <Text size="sm" c="green">
                    <NumberFormatter
                      value={selectedTuition.paidAmount}
                      prefix="Rp "
                      thousandSeparator="."
                      decimalSeparator=","
                    />
                  </Text>
                </div>
              </SimpleGrid>

              {/* Scholarship Information */}
              {selectedTuition.scholarship && (
                <Alert
                  icon={<IconGift size={18} />}
                  color="teal"
                  variant="light"
                  title={
                    selectedTuition.scholarship.isFullScholarship
                      ? "Full Scholarship"
                      : "Partial Scholarship"
                  }
                >
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm">Monthly Discount:</Text>
                      <Text size="sm" fw={600} c="teal">
                        <NumberFormatter
                          value={selectedTuition.scholarship.nominal}
                          prefix="- Rp "
                          thousandSeparator="."
                          decimalSeparator=","
                        />
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Original Fee:</Text>
                      <Text size="sm" td="line-through" c="dimmed">
                        <NumberFormatter
                          value={selectedTuition.feeAmount}
                          prefix="Rp "
                          thousandSeparator="."
                          decimalSeparator=","
                        />
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" fw={600}>
                        After Scholarship:
                      </Text>
                      <Text size="sm" fw={600} c="teal">
                        <NumberFormatter
                          value={Math.max(
                            0,
                            Number(selectedTuition.feeAmount) -
                              Number(selectedTuition.scholarship.nominal),
                          )}
                          prefix="Rp "
                          thousandSeparator="."
                          decimalSeparator=","
                        />
                      </Text>
                    </Group>
                  </Stack>
                </Alert>
              )}

              <div>
                <Group justify="space-between" mb={4}>
                  <Text size="xs" c="dimmed">
                    Payment Progress
                  </Text>
                  <Text size="xs" c="dimmed">
                    {paidPercentage.toFixed(0)}%
                  </Text>
                </Group>
                <Progress value={paidPercentage} color="green" size="sm" />
              </div>
              <Group justify="space-between">
                <Text size="sm" fw={600} c="red">
                  Remaining:{" "}
                  <NumberFormatter
                    value={remainingAmount}
                    prefix="Rp "
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Text>
                <Badge
                  color={
                    selectedTuition.status === "PARTIAL" ? "yellow" : "red"
                  }
                >
                  {selectedTuition.status}
                </Badge>
              </Group>
            </Stack>
          </Card>
        )}

        {selectedTuition && (
          <>
            <Group align="flex-end">
              <NumberInput
                label="Payment Amount"
                placeholder="Enter payment amount"
                value={amount}
                onChange={setAmount}
                min={1}
                max={remainingAmount}
                prefix="Rp "
                thousandSeparator="."
                decimalSeparator=","
                required
                style={{ flex: 1 }}
              />
              <Button variant="light" onClick={handlePayFull}>
                Pay Full
              </Button>
            </Group>

            <Textarea
              label="Notes (Optional)"
              placeholder="Payment notes..."
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
              rows={2}
            />

            <Alert
              icon={<IconAlertCircle size={18} />}
              color="blue"
              variant="light"
            >
              <Text size="sm">
                {Number(amount) >= remainingAmount
                  ? "This payment will mark the tuition as PAID."
                  : Number(amount) > 0
                    ? "This will be recorded as a partial payment."
                    : "Enter the payment amount to proceed."}
              </Text>
            </Alert>

            <Group>
              <Button
                leftSection={<IconCash size={18} />}
                onClick={handleSubmit}
                loading={createPayment.isPending}
                disabled={!amount || Number(amount) <= 0}
              >
                Process Payment
              </Button>
              <Button variant="light" onClick={() => router.push("/payments")}>
                View Payments
              </Button>
            </Group>
          </>
        )}

        {result && (
          <Alert
            icon={<IconCheck size={18} />}
            color="green"
            title="Payment Processed"
          >
            <Stack gap="xs">
              <Group gap="md">
                <Badge
                  color={
                    result.result.newStatus === "PAID" ? "green" : "yellow"
                  }
                  size="lg"
                >
                  {result.result.newStatus}
                </Badge>
              </Group>
              <SimpleGrid cols={2}>
                <Text size="sm">
                  Paid:{" "}
                  <NumberFormatter
                    value={result.result.newPaidAmount}
                    prefix="Rp "
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Text>
                <Text size="sm">
                  Remaining:{" "}
                  <NumberFormatter
                    value={result.result.remainingAmount}
                    prefix="Rp "
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Text>
              </SimpleGrid>
            </Stack>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
