"use client";

import PageHeader from "@/components/ui/PageHeader/PageHeader";
import TuitionGeneratorForm from "@/components/forms/TuitionGeneratorForm";

export default function GenerateTuitionsPage() {
  return (
    <>
      <PageHeader
        title="Generate Tuitions"
        description="Generate monthly tuition records for a class"
      />
      <TuitionGeneratorForm />
    </>
  );
}
