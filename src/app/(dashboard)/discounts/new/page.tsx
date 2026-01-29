"use client";

import DiscountForm from "@/components/forms/DiscountForm";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

export default function NewDiscountPage() {
  return (
    <>
      <PageHeader
        title="Add Discount"
        description="Create a new tuition discount for specific periods"
      />
      <DiscountForm />
    </>
  );
}
