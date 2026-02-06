"use client";

import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import AcademicYearTable from "@/components/tables/AcademicYearTable";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

export default function AcademicYearsPage() {
  const router = useRouter();
  const t = useTranslations();

  return (
    <>
      <PageHeader
        title={t("academicYear.list")}
        description={t("academicYear.description")}
        actions={
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => router.push("/admin/academic-years/new")}
          >
            {t("academicYear.add")}
          </Button>
        }
      />
      <AcademicYearTable />
    </>
  );
}
