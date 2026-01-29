"use client";

import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Divider,
  Group,
  MultiSelect,
  NumberFormatter,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconInfoCircle, IconPercentage } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAcademicYears } from "@/hooks/api/useAcademicYears";
import { useClassAcademics } from "@/hooks/api/useClassAcademics";
import {
  useCreateDiscount,
  useDiscount,
  useUpdateDiscount,
} from "@/hooks/api/useDiscounts";
import {
  getPeriodDisplayName,
  PERIODS,
} from "@/lib/business-logic/tuition-generator";

interface DiscountFormProps {
  discountId?: string;
}

const REASON_PRESETS = [
  { value: "COVID Relief", label: "COVID Relief" },
  { value: "School Anniversary", label: "School Anniversary" },
  { value: "Economic Support", label: "Economic Support" },
  { value: "Early Payment", label: "Early Payment Discount" },
  { value: "Sibling Discount", label: "Sibling Discount" },
  { value: "Other", label: "Other" },
];

export default function DiscountForm({ discountId }: DiscountFormProps) {
  const router = useRouter();
  const isEdit = !!discountId;

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number | string>(100000);
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [classAcademicId, setClassAcademicId] = useState<string | null>(null);
  const [isSchoolWide, setIsSchoolWide] = useState(true);
  const [targetPeriods, setTargetPeriods] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Queries
  const { data: academicYearsData, isLoading: loadingYears } = useAcademicYears(
    {
      limit: 100,
    },
  );
  const { data: classesData, isLoading: loadingClasses } = useClassAcademics({
    limit: 100,
    academicYearId: academicYearId || undefined,
  });
  const { data: discountData } = useDiscount(discountId || "");

  // Mutations
  const createDiscount = useCreateDiscount();
  const updateDiscount = useUpdateDiscount();

  // Load existing discount data
  useEffect(() => {
    if (discountData?.discount) {
      const d = discountData.discount;
      setName(d.name);
      setDescription(d.description || "");
      setReason(d.reason);
      setDiscountAmount(Number(d.discountAmount));
      setAcademicYearId(d.academicYearId);
      setClassAcademicId(d.classAcademicId);
      setIsSchoolWide(!d.classAcademicId);
      setTargetPeriods(d.targetPeriods);
      setIsActive(d.isActive);
    }
  }, [discountData]);

  // Auto-select active academic year
  useEffect(() => {
    if (!academicYearId && academicYearsData?.academicYears) {
      const activeYear = academicYearsData.academicYears.find(
        (ay) => ay.isActive,
      );
      if (activeYear) {
        setAcademicYearId(activeYear.id);
      }
    }
  }, [academicYearsData, academicYearId]);

  const handleSubmit = () => {
    if (!name.trim()) {
      notifications.show({
        title: "Validation Error",
        message: "Please enter a name",
        color: "red",
      });
      return;
    }

    if (!discountAmount || Number(discountAmount) <= 0) {
      notifications.show({
        title: "Validation Error",
        message: "Please enter a valid discount amount",
        color: "red",
      });
      return;
    }

    if (!academicYearId) {
      notifications.show({
        title: "Validation Error",
        message: "Please select an academic year",
        color: "red",
      });
      return;
    }

    if (targetPeriods.length === 0) {
      notifications.show({
        title: "Validation Error",
        message: "Please select at least one target period",
        color: "red",
      });
      return;
    }

    if (isEdit && discountId) {
      updateDiscount.mutate(
        {
          id: discountId,
          updates: {
            name,
            description: description || null,
            reason,
            discountAmount: Number(discountAmount),
            targetPeriods,
            isActive,
          },
        },
        {
          onSuccess: () => {
            notifications.show({
              title: "Success",
              message: "Discount updated successfully",
              color: "green",
            });
            router.push("/discounts");
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
    } else {
      createDiscount.mutate(
        {
          name,
          description: description || undefined,
          reason: reason || undefined,
          discountAmount: Number(discountAmount),
          targetPeriods,
          academicYearId,
          classAcademicId: isSchoolWide ? null : classAcademicId,
        },
        {
          onSuccess: () => {
            notifications.show({
              title: "Success",
              message: "Discount created successfully",
              color: "green",
            });
            router.push("/discounts");
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
    }
  };

  // Build period options
  const periodOptions = [
    {
      group: "Monthly",
      items: PERIODS.MONTHLY.map((p) => ({
        value: p,
        label: getPeriodDisplayName(p),
      })),
    },
    {
      group: "Quarterly",
      items: PERIODS.QUARTERLY.map((p) => ({
        value: p,
        label: getPeriodDisplayName(p),
      })),
    },
    {
      group: "Semester",
      items: PERIODS.SEMESTER.map((p) => ({
        value: p,
        label: getPeriodDisplayName(p),
      })),
    },
  ];

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

  const isPending = createDiscount.isPending || updateDiscount.isPending;

  return (
    <Paper withBorder p="lg" maw={600}>
      <Stack gap="md">
        <TextInput
          label="Discount Name"
          placeholder="e.g., COVID Relief Q2"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          required
        />

        <Textarea
          label="Description"
          placeholder="Optional description of the discount"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          rows={2}
        />

        <Select
          label="Reason"
          placeholder="Select or enter a reason"
          data={REASON_PRESETS}
          value={reason}
          onChange={setReason}
          searchable
          clearable
        />

        <NumberInput
          label="Discount Amount"
          description="Fixed amount to deduct from tuition fee"
          placeholder="Enter discount amount"
          value={discountAmount}
          onChange={setDiscountAmount}
          min={0}
          prefix="Rp "
          thousandSeparator="."
          decimalSeparator=","
          required
          leftSection={<IconPercentage size={16} />}
        />

        <Divider label="Scope" labelPosition="center" />

        <Select
          label="Academic Year"
          placeholder="Select academic year"
          data={academicYearOptions}
          value={academicYearId}
          onChange={(value) => {
            setAcademicYearId(value);
            setClassAcademicId(null);
          }}
          disabled={loadingYears || isEdit}
          required
        />

        <Checkbox
          label="Apply to all classes (School-wide)"
          checked={isSchoolWide}
          onChange={(e) => {
            setIsSchoolWide(e.currentTarget.checked);
            if (e.currentTarget.checked) {
              setClassAcademicId(null);
            }
          }}
          disabled={isEdit}
        />

        {!isSchoolWide && (
          <Select
            label="Specific Class"
            placeholder="Select class"
            data={classOptions}
            value={classAcademicId}
            onChange={setClassAcademicId}
            disabled={!academicYearId || loadingClasses || isEdit}
            searchable
            required={!isSchoolWide}
          />
        )}

        <Divider label="Target Periods" labelPosition="center" />

        <MultiSelect
          label="Target Periods"
          description="Select which periods this discount applies to"
          placeholder="Select periods"
          data={periodOptions}
          value={targetPeriods}
          onChange={setTargetPeriods}
          searchable
          clearable
          required
        />

        {targetPeriods.length > 0 && (
          <Group gap={4}>
            <Text size="sm" c="dimmed">
              Selected:
            </Text>
            {targetPeriods.map((p) => (
              <Badge key={p} size="sm" variant="light">
                {getPeriodDisplayName(p)}
              </Badge>
            ))}
          </Group>
        )}

        <Alert icon={<IconInfoCircle size={18} />} color="blue" variant="light">
          <Text size="sm">
            {isSchoolWide
              ? "This discount will apply to all classes in the selected academic year."
              : "This discount will only apply to the selected class."}
          </Text>
          <Text size="sm" mt="xs">
            Discounts are automatically applied to new tuitions during
            generation. Use the &quot;Apply&quot; action to apply to existing
            tuitions.
          </Text>
        </Alert>

        {isEdit && (
          <Checkbox
            label="Active"
            description="Inactive discounts won't be applied to new tuitions"
            checked={isActive}
            onChange={(e) => setIsActive(e.currentTarget.checked)}
          />
        )}

        {discountData?.stats && (
          <Alert
            icon={<IconCheck size={18} />}
            color="green"
            variant="light"
            title="Usage Statistics"
          >
            <Stack gap="xs">
              <Text size="sm">
                Applied to: {discountData.stats.totalTuitionsApplied} tuitions
              </Text>
              <Text size="sm">
                Total discount given:{" "}
                <NumberFormatter
                  value={discountData.stats.totalDiscountApplied}
                  prefix="Rp "
                  thousandSeparator="."
                  decimalSeparator=","
                />
              </Text>
            </Stack>
          </Alert>
        )}

        <Group>
          <Button
            leftSection={<IconPercentage size={18} />}
            onClick={handleSubmit}
            loading={isPending}
            disabled={
              !name ||
              !discountAmount ||
              !academicYearId ||
              targetPeriods.length === 0
            }
          >
            {isEdit ? "Update Discount" : "Create Discount"}
          </Button>
          <Button variant="light" onClick={() => router.push("/discounts")}>
            Cancel
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
