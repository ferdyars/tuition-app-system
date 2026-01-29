"use client";

import { Button, Select, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";

interface EmployeeFormValues {
  name: string;
  email: string;
  role: "ADMIN" | "CASHIER";
}

interface EmployeeFormProps {
  initialData?: Partial<EmployeeFormValues>;
  onSubmit: (data: EmployeeFormValues) => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

export default function EmployeeForm({
  initialData,
  onSubmit,
  isLoading,
  isEdit,
}: EmployeeFormProps) {
  const form = useForm<EmployeeFormValues>({
    initialValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      role: initialData?.role || "CASHIER",
    },
    validate: {
      name: (value) => (value.length < 1 ? "Name is required" : null),
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : "Invalid email address",
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack gap="md">
        <TextInput
          label="Name"
          placeholder="Enter employee name"
          required
          {...form.getInputProps("name")}
        />
        <TextInput
          label="Email"
          placeholder="employee@school.com"
          required
          {...form.getInputProps("email")}
        />
        <Select
          label="Role"
          data={[
            { value: "ADMIN", label: "Admin" },
            { value: "CASHIER", label: "Cashier" },
          ]}
          required
          {...form.getInputProps("role")}
        />
        <Button type="submit" loading={isLoading}>
          {isEdit ? "Update Employee" : "Create Employee"}
        </Button>
      </Stack>
    </form>
  );
}
