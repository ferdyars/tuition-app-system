"use client";

import ScholarshipForm from "@/components/forms/ScholarshipForm";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

export default function NewScholarshipPage() {
  return (
    <>
      <PageHeader
        title="Add Scholarship"
        description="Create a new scholarship for a student"
      />
      <ScholarshipForm />
    </>
  );
}
