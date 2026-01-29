"use client";

import { Button, Stack, Textarea, TextInput } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";

interface StudentFormValues {
  nis: string;
  nik: string;
  name: string;
  address: string;
  parentName: string;
  parentPhone: string;
  startJoinDate: Date | null;
}

interface StudentFormProps {
  initialData?: {
    nis?: string;
    nik?: string;
    name?: string;
    address?: string;
    parentName?: string;
    parentPhone?: string;
    startJoinDate?: string | Date;
  };
  onSubmit: (data: {
    nis: string;
    nik: string;
    name: string;
    address: string;
    parentName: string;
    parentPhone: string;
    startJoinDate: string;
  }) => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

export default function StudentForm({
  initialData,
  onSubmit,
  isLoading,
  isEdit,
}: StudentFormProps) {
  const form = useForm<StudentFormValues>({
    initialValues: {
      nis: initialData?.nis || "",
      nik: initialData?.nik || "",
      name: initialData?.name || "",
      address: initialData?.address || "",
      parentName: initialData?.parentName || "",
      parentPhone: initialData?.parentPhone || "",
      startJoinDate: initialData?.startJoinDate
        ? new Date(initialData.startJoinDate)
        : null,
    },
    validate: {
      nis: (value) => (value.length < 1 ? "NIS is required" : null),
      nik: (value) =>
        value.length !== 16 ? "NIK must be exactly 16 digits" : null,
      name: (value) => (value.length < 1 ? "Name is required" : null),
      address: (value) => (value.length < 1 ? "Address is required" : null),
      parentName: (value) =>
        value.length < 1 ? "Parent name is required" : null,
      parentPhone: (value) =>
        value.length < 10 ? "Phone must be at least 10 digits" : null,
      startJoinDate: (value) => (!value ? "Start date is required" : null),
    },
  });

  const handleSubmit = (values: StudentFormValues) => {
    if (!values.startJoinDate) return;
    onSubmit({
      ...values,
      startJoinDate: values.startJoinDate.toISOString(),
    });
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label="NIS (Student ID)"
          placeholder="2024001"
          required
          disabled={isEdit}
          {...form.getInputProps("nis")}
        />
        <TextInput
          label="NIK (National ID)"
          placeholder="3578123456789012"
          required
          maxLength={16}
          {...form.getInputProps("nik")}
        />
        <TextInput
          label="Student Name"
          placeholder="Ahmad Rizki"
          required
          {...form.getInputProps("name")}
        />
        <Textarea
          label="Address"
          placeholder="Jl. Merdeka No. 123"
          required
          {...form.getInputProps("address")}
        />
        <TextInput
          label="Parent Name"
          placeholder="Budi Santoso"
          required
          {...form.getInputProps("parentName")}
        />
        <TextInput
          label="Parent Phone"
          placeholder="081234567890"
          required
          {...form.getInputProps("parentPhone")}
        />
        <DatePickerInput
          label="Start Join Date"
          placeholder="Select date"
          required
          {...form.getInputProps("startJoinDate")}
        />
        <Button type="submit" loading={isLoading}>
          {isEdit ? "Update Student" : "Create Student"}
        </Button>
      </Stack>
    </form>
  );
}
