"use client";

import { LoadingOverlay, Paper, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { use } from "react";
import StudentForm from "@/components/forms/StudentForm";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { useStudent, useUpdateStudent } from "@/hooks/api/useStudents";

export default function EditStudentPage({
  params,
}: {
  params: Promise<{ nis: string }>;
}) {
  const { nis } = use(params);
  const router = useRouter();
  const { data: student, isLoading } = useStudent(nis);
  const updateStudent = useUpdateStudent();

  const handleSubmit = (data: {
    nis: string;
    nik: string;
    name: string;
    address: string;
    parentName: string;
    parentPhone: string;
    startJoinDate: string;
  }) => {
    const { nis: _nis, ...updates } = data;
    updateStudent.mutate(
      { nis, updates },
      {
        onSuccess: () => {
          notifications.show({
            title: "Success",
            message: "Student updated successfully",
            color: "green",
          });
          router.push("/students");
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
  if (!student) return <Text>Student not found</Text>;

  return (
    <>
      <PageHeader
        title="Edit Student"
        description={`Editing ${student.name}`}
      />
      <Paper withBorder p="lg" maw={600}>
        <StudentForm
          initialData={student}
          onSubmit={handleSubmit}
          isLoading={updateStudent.isPending}
          isEdit
        />
      </Paper>
    </>
  );
}
