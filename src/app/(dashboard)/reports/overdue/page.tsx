"use client";

import { Button, Group } from "@mantine/core";
import { IconChartBar } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import OverdueReportTable from "@/components/tables/OverdueReportTable";

export default function OverdueReportPage() {
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="Overdue Report"
        description="View and export overdue payment reports"
        actions={
          <Group gap="sm">
            <Button
              variant="light"
              leftSection={<IconChartBar size={18} />}
              onClick={() => router.push("/reports/class-summary")}
            >
              Class Summary
            </Button>
          </Group>
        }
      />
      <OverdueReportTable />
    </>
  );
}
