"use client";

import TuitionGeneratorForm from "@/components/forms/TuitionGeneratorForm";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

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
