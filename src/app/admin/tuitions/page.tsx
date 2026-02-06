"use client";

import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import TuitionTable from "@/components/tables/TuitionTable";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

export default function TuitionsPage() {
  const router = useRouter();
  const t = useTranslations();

  return (
    <>
      <PageHeader
        title={t("tuition.list")}
        description={t("tuition.description")}
        actions={
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => router.push("/admin/tuitions/generate")}
          >
            {t("tuition.generate")}
          </Button>
        }
      />
      <TuitionTable />
    </>
  );
}
