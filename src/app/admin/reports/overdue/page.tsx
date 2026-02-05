"use client";

import { Button, Group } from "@mantine/core";
import { IconChartBar } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import OverdueReportTable from "@/components/tables/OverdueReportTable";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

export default function OverdueReportPage() {
  const router = useRouter();
  const t = useTranslations();

  return (
    <>
      <PageHeader
        title={t("report.overdue.title")}
        description={t("report.overdue.description")}
        actions={
          <Group gap="sm">
            <Button
              variant="light"
              leftSection={<IconChartBar size={18} />}
              onClick={() => router.push("/admin/reports/class-summary")}
            >
              {t("report.classSummary.title")}
            </Button>
          </Group>
        }
      />
      <OverdueReportTable />
    </>
  );
}
