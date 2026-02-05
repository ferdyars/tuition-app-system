"use client";

import { Button, Group } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import ClassSummaryCards from "@/components/reports/ClassSummaryCards";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

export default function ClassSummaryPage() {
  const router = useRouter();
  const t = useTranslations();

  return (
    <>
      <PageHeader
        title={t("report.classSummary.title")}
        description={t("report.classSummary.description")}
        actions={
          <Group gap="sm">
            <Button
              variant="light"
              color="red"
              leftSection={<IconAlertTriangle size={18} />}
              onClick={() => router.push("/admin/reports/overdue")}
            >
              {t("report.overdue.title")}
            </Button>
          </Group>
        }
      />
      <ClassSummaryCards />
    </>
  );
}
