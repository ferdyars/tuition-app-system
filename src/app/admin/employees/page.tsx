"use client";

import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import EmployeeTable from "@/components/tables/EmployeeTable";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

export default function EmployeesPage() {
  const t = useTranslations();
  const router = useRouter();

  return (
    <>
      <PageHeader
        title={t("employee.list")}
        description={t("employee.title")}
        actions={
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => router.push("/admin/employees/new")}
          >
            {t("employee.add")}
          </Button>
        }
      />
      <EmployeeTable />
    </>
  );
}
