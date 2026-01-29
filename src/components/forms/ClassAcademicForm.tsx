"use client";

import {
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAcademicYears } from "@/hooks/api/useAcademicYears";

interface ClassAcademicFormValues {
  academicYearId: string;
  grade: number;
  section: string;
}

interface ClassAcademicFormProps {
  initialData?: {
    academicYearId?: string;
    grade?: number;
    section?: string;
  };
  onSubmit: (data: ClassAcademicFormValues) => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

export default function ClassAcademicForm({
  initialData,
  onSubmit,
  isLoading,
  isEdit,
}: ClassAcademicFormProps) {
  const { data: academicYearsData } = useAcademicYears({ limit: 100 });

  const form = useForm<ClassAcademicFormValues>({
    initialValues: {
      academicYearId: initialData?.academicYearId || "",
      grade: initialData?.grade || 1,
      section: initialData?.section || "",
    },
    validate: {
      academicYearId: (value) => (!value ? "Academic year is required" : null),
      grade: (value) =>
        value < 1 || value > 12 ? "Grade must be between 1 and 12" : null,
      section: (value) => (value.length < 1 ? "Section is required" : null),
    },
  });

  const academicYearOptions =
    academicYearsData?.academicYears.map((ay) => ({
      value: ay.id,
      label: `${ay.year}${ay.isActive ? " (Active)" : ""}`,
    })) || [];

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack gap="md">
        <Select
          label="Academic Year"
          placeholder="Select academic year"
          data={academicYearOptions}
          required
          searchable
          {...form.getInputProps("academicYearId")}
        />
        <Group grow>
          <NumberInput
            label="Grade"
            placeholder="1-12"
            required
            min={1}
            max={12}
            {...form.getInputProps("grade")}
          />
          <TextInput
            label="Section"
            placeholder="A, B, IPA, IPS, etc."
            required
            {...form.getInputProps("section")}
          />
        </Group>

        <Button type="submit" loading={isLoading}>
          {isEdit ? "Update Class" : "Create Class"}
        </Button>
      </Stack>
    </form>
  );
}
