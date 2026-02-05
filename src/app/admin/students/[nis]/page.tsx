"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  LoadingOverlay,
  Modal,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconKey,
  IconTrash,
  IconUserPlus,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import StudentForm from "@/components/forms/StudentForm";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import {
  useCreateStudentAccount,
  useDeleteStudentAccount,
  useResetStudentPassword,
  useRestoreStudentAccount,
} from "@/hooks/api/useStudentAccounts";
import { useStudent, useUpdateStudent } from "@/hooks/api/useStudents";

export default function EditStudentPage({
  params,
}: {
  params: Promise<{ nis: string }>;
}) {
  const { nis } = use(params);
  const router = useRouter();
  const { data: student, isLoading, refetch } = useStudent(nis);
  const updateStudent = useUpdateStudent();

  const [
    createAccountModalOpened,
    { open: openCreateModal, close: closeCreateModal },
  ] = useDisclosure(false);
  const [
    resetPasswordModalOpened,
    { open: openResetModal, close: closeResetModal },
  ] = useDisclosure(false);
  const [
    deleteAccountModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  const createAccount = useCreateStudentAccount();
  const resetPassword = useResetStudentPassword();
  const deleteAccount = useDeleteStudentAccount();
  const restoreAccount = useRestoreStudentAccount();

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
          router.push("/admin/students");
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

  const handleCreateAccount = () => {
    createAccount.mutate(nis, {
      onSuccess: (data) => {
        setCreatedPassword(data.defaultPassword);
        notifications.show({
          title: "Berhasil",
          message: "Akun student berhasil dibuat",
          color: "green",
        });
        refetch();
      },
      onError: (err) => {
        notifications.show({
          title: "Error",
          message: err instanceof Error ? err.message : "Gagal membuat akun",
          color: "red",
        });
        closeCreateModal();
      },
    });
  };

  const handleResetPassword = () => {
    resetPassword.mutate(nis, {
      onSuccess: (data) => {
        notifications.show({
          title: "Berhasil",
          message: `Password direset ke: ${data.newPassword}`,
          color: "green",
        });
        closeResetModal();
      },
      onError: (err) => {
        notifications.show({
          title: "Error",
          message: err instanceof Error ? err.message : "Gagal reset password",
          color: "red",
        });
      },
    });
  };

  const handleDeleteAccount = () => {
    deleteAccount.mutate(
      { nis, reason: "Manual deletion by admin" },
      {
        onSuccess: () => {
          notifications.show({
            title: "Berhasil",
            message: "Akun berhasil dihapus",
            color: "green",
          });
          closeDeleteModal();
          refetch();
        },
        onError: (err) => {
          notifications.show({
            title: "Error",
            message:
              err instanceof Error ? err.message : "Gagal menghapus akun",
            color: "red",
          });
        },
      },
    );
  };

  const handleRestoreAccount = () => {
    restoreAccount.mutate(nis, {
      onSuccess: () => {
        notifications.show({
          title: "Berhasil",
          message: "Akun berhasil dipulihkan",
          color: "green",
        });
        refetch();
      },
      onError: (err) => {
        notifications.show({
          title: "Error",
          message: err instanceof Error ? err.message : "Gagal memulihkan akun",
          color: "red",
        });
      },
    });
  };

  if (isLoading) return <LoadingOverlay visible />;
  if (!student) return <Text>Student not found</Text>;

  const hasAccount = student.hasAccount;
  const isDeleted = student.accountDeleted;

  return (
    <>
      <PageHeader
        title="Edit Student"
        description={`Editing ${student.name}`}
      />

      <Stack gap="lg">
        {/* Student Form */}
        <Paper withBorder p="lg" maw={600}>
          <StudentForm
            initialData={student}
            onSubmit={handleSubmit}
            isLoading={updateStudent.isPending}
            isEdit
          />
        </Paper>

        {/* Account Management */}
        <Card withBorder maw={600}>
          <Stack gap="md">
            <Title order={5}>Student Portal Account</Title>

            {!hasAccount ? (
              <>
                <Alert icon={<IconAlertCircle size={18} />} color="gray">
                  Student ini belum memiliki akun portal.
                </Alert>
                <Button
                  leftSection={<IconUserPlus size={18} />}
                  onClick={openCreateModal}
                >
                  Buat Akun Portal
                </Button>
              </>
            ) : isDeleted ? (
              <>
                <Alert icon={<IconAlertCircle size={18} />} color="red">
                  Akun telah dihapus. Student tidak dapat login.
                </Alert>
                <Button
                  variant="outline"
                  onClick={handleRestoreAccount}
                  loading={restoreAccount.isPending}
                >
                  Pulihkan Akun
                </Button>
              </>
            ) : (
              <>
                <Group>
                  <Badge color="green" variant="light">
                    Akun Aktif
                  </Badge>
                  {student.mustChangePassword && (
                    <Badge color="yellow" variant="light">
                      Perlu Ganti Password
                    </Badge>
                  )}
                </Group>

                <Divider />

                <Group>
                  <Button
                    variant="outline"
                    leftSection={<IconKey size={18} />}
                    onClick={openResetModal}
                  >
                    Reset Password
                  </Button>
                  <Button
                    variant="outline"
                    color="red"
                    leftSection={<IconTrash size={18} />}
                    onClick={openDeleteModal}
                  >
                    Hapus Akun
                  </Button>
                </Group>
              </>
            )}
          </Stack>
        </Card>
      </Stack>

      {/* Create Account Modal */}
      <Modal
        opened={createAccountModalOpened}
        onClose={() => {
          closeCreateModal();
          setCreatedPassword(null);
        }}
        title="Buat Akun Portal"
      >
        <Stack gap="md">
          {createdPassword ? (
            <>
              <Alert icon={<IconCheck size={18} />} color="green">
                Akun berhasil dibuat!
              </Alert>
              <Text>
                Password default: <strong>{createdPassword}</strong>
              </Text>
              <Text size="sm" c="dimmed">
                Berikan password ini kepada orang tua/wali siswa. Student akan
                diminta untuk mengganti password saat pertama kali login.
              </Text>
              <Button
                onClick={() => {
                  closeCreateModal();
                  setCreatedPassword(null);
                }}
              >
                Tutup
              </Button>
            </>
          ) : (
            <>
              <Text>
                Akun portal akan dibuat dengan password default nomor HP orang
                tua: <strong>{student.parentPhone}</strong>
              </Text>
              <Group justify="flex-end">
                <Button variant="outline" onClick={closeCreateModal}>
                  Batal
                </Button>
                <Button
                  onClick={handleCreateAccount}
                  loading={createAccount.isPending}
                >
                  Buat Akun
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        opened={resetPasswordModalOpened}
        onClose={closeResetModal}
        title="Reset Password"
      >
        <Stack gap="md">
          <Text>
            Password akan direset ke nomor HP orang tua:{" "}
            <strong>{student.parentPhone}</strong>
          </Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={closeResetModal}>
              Batal
            </Button>
            <Button
              onClick={handleResetPassword}
              loading={resetPassword.isPending}
            >
              Reset Password
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        opened={deleteAccountModalOpened}
        onClose={closeDeleteModal}
        title="Hapus Akun"
      >
        <Stack gap="md">
          <Text>
            Akun akan di-soft delete. Student tidak dapat login sampai akun
            dipulihkan.
          </Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={closeDeleteModal}>
              Batal
            </Button>
            <Button
              color="red"
              onClick={handleDeleteAccount}
              loading={deleteAccount.isPending}
            >
              Hapus Akun
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
