"use client";

import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import EmployeeTable from "@/components/tables/EmployeeTable";

export default function EmployeesPage() {
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="Employees"
        description="Manage employee accounts"
        actions={
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => router.push("/employees/new")}
          >
            Add Employee
          </Button>
        }
      />
      <EmployeeTable />
    </>
  );
}
