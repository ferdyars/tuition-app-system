"use client";

import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import AcademicYearTable from "@/components/tables/AcademicYearTable";

export default function AcademicYearsPage() {
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="Academic Years"
        description="Manage school academic years"
        actions={
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => router.push("/academic-years/new")}
          >
            Add Academic Year
          </Button>
        }
      />
      <AcademicYearTable />
    </>
  );
}
