"use client";

import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import PaymentTable from "@/components/tables/PaymentTable";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

export default function PaymentsPage() {
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="Payments"
        description="View and manage tuition payments"
        actions={
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => router.push("/payments/new")}
          >
            New Payment
          </Button>
        }
      />
      <PaymentTable />
    </>
  );
}
