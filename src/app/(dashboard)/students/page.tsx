"use client";

import { Button, Group } from "@mantine/core";
import { IconFileUpload, IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import StudentTable from "@/components/tables/StudentTable";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { usePermissions } from "@/hooks/usePermissions";

export default function StudentsPage() {
  const router = useRouter();
  const { canCreate } = usePermissions();

  return (
    <>
      <PageHeader
        title="Students"
        description="Manage student records"
        actions={
          canCreate ? (
            <Group>
              <Button
                leftSection={<IconFileUpload size={18} />}
                variant="light"
                onClick={() => router.push("/students/import")}
              >
                Import Excel
              </Button>
              <Button
                leftSection={<IconPlus size={18} />}
                onClick={() => router.push("/students/new")}
              >
                Add Student
              </Button>
            </Group>
          ) : undefined
        }
      />
      <StudentTable />
    </>
  );
}
