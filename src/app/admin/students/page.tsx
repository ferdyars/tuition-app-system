"use client";

import { Button, Group } from "@mantine/core";
import { IconFileUpload, IconPlus } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import StudentTable from "@/components/tables/StudentTable";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { usePermissions } from "@/hooks/usePermissions";

export default function StudentsPage() {
  const router = useRouter();
  const { canCreate } = usePermissions();
  const t = useTranslations();

  return (
    <>
      <PageHeader
        title={t("student.list")}
        description={t("student.title")}
        actions={
          canCreate ? (
            <Group>
              <Button
                leftSection={<IconFileUpload size={18} />}
                variant="light"
                onClick={() => router.push("/admin/students/import")}
              >
                {t("student.import")}
              </Button>
              <Button
                leftSection={<IconPlus size={18} />}
                onClick={() => router.push("/admin/students/new")}
              >
                {t("student.add")}
              </Button>
            </Group>
          ) : undefined
        }
      />
      <StudentTable />
    </>
  );
}
