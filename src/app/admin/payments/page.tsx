"use client";

import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import PaymentTable from "@/components/tables/PaymentTable";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

export default function PaymentsPage() {
  const router = useRouter();
  const t = useTranslations();

  return (
    <>
      <PageHeader
        title={t("payment.title")}
        description={t("payment.description")}
        actions={
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => router.push("/admin/payments/new")}
          >
            {t("payment.newPayment")}
          </Button>
        }
      />
      <PaymentTable />
    </>
  );
}
