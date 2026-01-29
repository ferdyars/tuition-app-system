"use client";

import { use } from "react";
import DiscountForm from "@/components/forms/DiscountForm";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

interface EditDiscountPageProps {
  params: Promise<{ id: string }>;
}

export default function EditDiscountPage({ params }: EditDiscountPageProps) {
  const { id } = use(params);

  return (
    <>
      <PageHeader
        title="Edit Discount"
        description="Update discount settings and status"
      />
      <DiscountForm discountId={id} />
    </>
  );
}
