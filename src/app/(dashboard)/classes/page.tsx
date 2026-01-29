"use client";

import { Button, Group, Menu } from "@mantine/core";
import {
  IconChevronDown,
  IconFileUpload,
  IconPlus,
  IconUsers,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import ClassAcademicTable from "@/components/tables/ClassAcademicTable";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

export default function ClassesPage() {
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="Classes"
        description="Manage academic classes and student assignments"
        actions={
          <Group>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button
                  leftSection={<IconFileUpload size={18} />}
                  variant="light"
                  rightSection={<IconChevronDown size={14} />}
                >
                  Import
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconFileUpload size={16} />}
                  onClick={() => router.push("/classes/import")}
                >
                  Import Classes
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconUsers size={16} />}
                  onClick={() => router.push("/classes/students/import")}
                >
                  Import Student Assignments
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => router.push("/classes/new")}
            >
              Add Class
            </Button>
          </Group>
        }
      />
      <ClassAcademicTable />
    </>
  );
}
