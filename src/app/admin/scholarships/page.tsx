"use client";

import { Button, Group } from "@mantine/core";
import { IconFileUpload, IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ScholarshipTable from "@/components/tables/ScholarshipTable";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

export default function ScholarshipsPage() {
  const router = useRouter();
  const t = useTranslations();

  return (
    <>
      <PageHeader
        title={t("scholarship.title")}
        description={t("scholarship.description")}
        actions={
          <Group>
            <Button
              leftSection={<IconFileUpload size={18} />}
              variant="light"
              onClick={() => router.push("/admin/scholarships/import")}
            >
              {t("scholarship.import")}
            </Button>
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => router.push("/admin/scholarships/new")}
            >
              {t("scholarship.add")}
            </Button>
          </Group>
        }
      />
      <ScholarshipTable />
    </>
  );
}
