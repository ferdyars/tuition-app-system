"use client";

import { LoadingOverlay, Paper, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { use } from "react";
import ClassAcademicForm from "@/components/forms/ClassAcademicForm";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import {
  useClassAcademic,
  useUpdateClassAcademic,
} from "@/hooks/api/useClassAcademics";

export default function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: classAcademic, isLoading } = useClassAcademic(id);
  const updateClass = useUpdateClassAcademic();

  const handleSubmit = (data: {
    academicYearId: string;
    grade: number;
    section: string;
  }) => {
    updateClass.mutate(
      { id, updates: data },
      {
        onSuccess: () => {
          notifications.show({
            title: "Success",
            message: "Class updated successfully",
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
      },
    );
  };

  if (isLoading) return <LoadingOverlay visible />;
  if (!classAcademic) return <Text>Class not found</Text>;

  return (
    <>
      <PageHeader
        title="Edit Class"
        description={`Editing ${classAcademic.className}`}
      />
      <Paper withBorder p="lg" maw={500}>
        <ClassAcademicForm
          initialData={classAcademic}
          onSubmit={handleSubmit}
          isLoading={updateClass.isPending}
          isEdit
        />
      </Paper>
    </>
  );
}
