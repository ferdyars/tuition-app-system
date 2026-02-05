"use client";

import { Paper } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import AcademicYearForm from "@/components/forms/AcademicYearForm";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { useCreateAcademicYear } from "@/hooks/api/useAcademicYears";

export default function NewAcademicYearPage() {
  const router = useRouter();
  const createAcademicYear = useCreateAcademicYear();

  const handleSubmit = (data: {
    year: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }) => {
    createAcademicYear.mutate(data, {
      onSuccess: () => {
        notifications.show({
          title: "Success",
          message: "Academic year created successfully",
          color: "green",
        });
        router.push("/admin/academic-years");
      },
      onError: (error) => {
        notifications.show({
          title: "Error",
          message: error.message,
          color: "red",
        });
      },
    });
  };

  return (
    <>
      <PageHeader
        title="Add Academic Year"
        description="Create a new academic year"
      />
      <Paper withBorder p="lg" maw={500}>
        <AcademicYearForm
          onSubmit={handleSubmit}
          isLoading={createAcademicYear.isPending}
        />
      </Paper>
    </>
  );
}
