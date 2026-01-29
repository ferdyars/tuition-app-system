"use client";

import { Paper } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import EmployeeForm from "@/components/forms/EmployeeForm";
import { useCreateEmployee } from "@/hooks/api/useEmployees";

export default function NewEmployeePage() {
  const router = useRouter();
  const createEmployee = useCreateEmployee();

  const handleSubmit = (data: {
    name: string;
    email: string;
    role: "ADMIN" | "CASHIER";
  }) => {
    createEmployee.mutate(data, {
      onSuccess: () => {
        notifications.show({
          title: "Success",
          message: "Employee created with default password (123456)",
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
    });
  };

  return (
    <>
      <PageHeader title="Add Employee" description="Create a new employee account" />
      <Paper withBorder p="lg" maw={500}>
        <EmployeeForm
          onSubmit={handleSubmit}
          isLoading={createEmployee.isPending}
        />
      </Paper>
    </>
  );
}
