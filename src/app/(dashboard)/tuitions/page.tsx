"use client";

import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import TuitionTable from "@/components/tables/TuitionTable";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

export default function TuitionsPage() {
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="Tuitions"
        description="Manage student tuition records"
        actions={
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => router.push("/tuitions/generate")}
          >
            Generate Tuitions
          </Button>
        }
      />
      <TuitionTable />
    </>
  );
}
