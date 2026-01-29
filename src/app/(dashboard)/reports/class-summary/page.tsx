"use client";

import { Button, Group } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import ClassSummaryCards from "@/components/reports/ClassSummaryCards";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

export default function ClassSummaryPage() {
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="Class Summary"
        description="View payment statistics by class"
        actions={
          <Group gap="sm">
            <Button
              variant="light"
              color="red"
              leftSection={<IconAlertTriangle size={18} />}
              onClick={() => router.push("/reports/overdue")}
            >
              Overdue Report
            </Button>
          </Group>
        }
      />
      <ClassSummaryCards />
    </>
  );
}
