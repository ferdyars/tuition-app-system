"use client";

import { Button, Group } from "@mantine/core";
import { IconFileUpload, IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import DiscountTable from "@/components/tables/DiscountTable";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

export default function DiscountsPage() {
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="Discounts"
        description="Manage tuition discounts for periods (COVID relief, school support, etc.)"
        actions={
          <Group>
            <Button
              leftSection={<IconFileUpload size={18} />}
              variant="light"
              onClick={() => router.push("/discounts/import")}
            >
              Import Excel
            </Button>
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => router.push("/discounts/new")}
            >
              Add Discount
            </Button>
          </Group>
        }
      />
      <DiscountTable />
    </>
  );
}
