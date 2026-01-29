"use client";

import PageHeader from "@/components/ui/PageHeader/PageHeader";
import PaymentForm from "@/components/forms/PaymentForm";

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
