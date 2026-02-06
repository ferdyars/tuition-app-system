"use client";

import { Button, Group, Menu } from "@mantine/core";
import {
  IconChevronDown,
  IconFileUpload,
  IconPlus,
  IconUsers,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ClassAcademicTable from "@/components/tables/ClassAcademicTable";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

export default function ClassesPage() {
  const router = useRouter();
  const t = useTranslations();

  return (
    <>
      <PageHeader
        title={t("class.list")}
        description={t("class.description")}
        actions={
          <Group>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button
                  leftSection={<IconFileUpload size={18} />}
                  variant="light"
                  rightSection={<IconChevronDown size={14} />}
                >
                  {t("common.import")}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconFileUpload size={16} />}
                  onClick={() => router.push("/admin/classes/import")}
                >
                  {t("class.importClasses")}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconUsers size={16} />}
                  onClick={() => router.push("/admin/classes/students/import")}
                >
                  {t("class.importStudentAssignments")}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => router.push("/admin/classes/new")}
            >
              {t("class.add")}
            </Button>
          </Group>
        }
      />
      <ClassAcademicTable />
    </>
  );
}
