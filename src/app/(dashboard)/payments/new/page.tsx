"use client";

import PaymentForm from "@/components/forms/PaymentForm";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

export default function NewPaymentPage() {
  return (
    <>
      <PageHeader
        title="Process Payment"
        description="Record a tuition payment for a student"
      />
      <PaymentForm />
    </>
  );
}
