"use client";

import { LoadingOverlay, Paper, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { use } from "react";
import EmployeeForm from "@/components/forms/EmployeeForm";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { useEmployee, useUpdateEmployee } from "@/hooks/api/useEmployees";

export default function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: employee, isLoading } = useEmployee(id);
  const updateEmployee = useUpdateEmployee();

  const handleSubmit = (data: {
    name: string;
    email: string;
    role: "ADMIN" | "CASHIER";
  }) => {
    updateEmployee.mutate(
      { id, updates: data },
      {
        onSuccess: () => {
          notifications.show({
            title: "Success",
            message: "Employee updated successfully",
            color: "green",
          });
          router.push("/employees");
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

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (!employee) {
    return <Text>Employee not found</Text>;
  }

  return (
    <>
      <PageHeader
        title="Edit Employee"
        description={`Editing ${employee.name}`}
      />
      <Paper withBorder p="lg" maw={500}>
        <EmployeeForm
          initialData={employee}
          onSubmit={handleSubmit}
          isLoading={updateEmployee.isPending}
          isEdit
        />
      </Paper>
    </>
  );
}
