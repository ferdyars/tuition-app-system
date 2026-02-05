"use client";

import { Paper } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import StudentForm from "@/components/forms/StudentForm";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { useCreateStudent } from "@/hooks/api/useStudents";

export default function NewStudentPage() {
  const router = useRouter();
  const createStudent = useCreateStudent();

  const handleSubmit = (data: {
    nis: string;
    nik: string;
    name: string;
    address: string;
    parentName: string;
    parentPhone: string;
    startJoinDate: string;
  }) => {
    createStudent.mutate(data, {
      onSuccess: () => {
        notifications.show({
          title: "Success",
          message: "Student created successfully",
          color: "green",
        });
        router.push("/admin/students");
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
        title="Add Student"
        description="Create a new student record"
      />
      <Paper withBorder p="lg" maw={600}>
        <StudentForm
          onSubmit={handleSubmit}
          isLoading={createStudent.isPending}
        />
      </Paper>
    </>
  );
}
