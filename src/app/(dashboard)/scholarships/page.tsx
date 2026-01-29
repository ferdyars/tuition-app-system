"use client";

import { Button, Group } from "@mantine/core";
import { IconPlus, IconFileUpload } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import ScholarshipTable from "@/components/tables/ScholarshipTable";

export default function ScholarshipsPage() {
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="Scholarships"
        description="Manage student scholarships"
        actions={
          <Group>
            <Button
              leftSection={<IconFileUpload size={18} />}
              variant="light"
              onClick={() => router.push("/scholarships/import")}
            >
              Import Excel
            </Button>
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => router.push("/scholarships/new")}
            >
              Add Scholarship
            </Button>
          </Group>
        }
      />
      <ScholarshipTable />
    </>
  );
}
