"use client";

import { Paper } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import ClassAcademicForm from "@/components/forms/ClassAcademicForm";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { useCreateClassAcademic } from "@/hooks/api/useClassAcademics";

export default function NewClassPage() {
  const router = useRouter();
  const createClass = useCreateClassAcademic();

  const handleSubmit = (data: {
    academicYearId: string;
    grade: number;
    section: string;
  }) => {
    createClass.mutate(data, {
      onSuccess: () => {
        notifications.show({
          title: "Success",
          message: "Class created successfully",
          color: "green",
        });
        router.push("/classes");
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
      <PageHeader title="Add Class" description="Create a new academic class" />
      <Paper withBorder p="lg" maw={500}>
        <ClassAcademicForm
          onSubmit={handleSubmit}
          isLoading={createClass.isPending}
        />
      </Paper>
    </>
  );
}
