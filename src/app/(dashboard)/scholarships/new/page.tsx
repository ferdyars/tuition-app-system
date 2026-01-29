"use client";

import PageHeader from "@/components/ui/PageHeader/PageHeader";
import ScholarshipForm from "@/components/forms/ScholarshipForm";

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
