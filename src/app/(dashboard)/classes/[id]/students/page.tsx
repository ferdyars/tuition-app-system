"use client";

import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import {
  useAssignStudentsToClass,
  useRemoveStudentsFromClass,
  useStudentsByClass,
  useUnassignedStudents,
} from "@/hooks/api/useStudentClasses";

export default function ClassStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchUnassigned, setSearchUnassigned] = useState("");
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [opened, { open, close }] = useDisclosure(false);

  const { data, isLoading } = useStudentsByClass(classId);
  const { data: unassignedData, isLoading: loadingUnassigned } =
    useUnassignedStudents({
      classAcademicId: classId,
      search: searchUnassigned || undefined,
      limit: 100,
    });

  const assignStudents = useAssignStudentsToClass();
  const removeStudents = useRemoveStudentsFromClass();

  const handleSelectAll = (checked: boolean) => {
    if (checked && data) {
      setSelectedStudents(data.students.map((s) => s.nis));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (nis: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents((prev) => [...prev, nis]);
    } else {
      setSelectedStudents((prev) => prev.filter((n) => n !== nis));
    }
  };

  const handleRemoveSelected = () => {
    if (selectedStudents.length === 0) return;

    modals.openConfirmModal({
      title: "Remove Students",
      children: (
        <Text size="sm">
          Are you sure you want to remove {selectedStudents.length} student(s)
          from this class? This will not delete their tuition records.
        </Text>
      ),
      labels: { confirm: "Remove", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        removeStudents.mutate(
          { classAcademicId: classId, studentNisList: selectedStudents },
          {
            onSuccess: () => {
              setSelectedStudents([]);
            },
          },
        );
      },
    });
  };

  const handleAddStudents = () => {
    if (selectedToAdd.length === 0) {
      notifications.show({
        title: "No students selected",
        message: "Please select at least one student to add",
        color: "yellow",
      });
      return;
    }

    assignStudents.mutate(
      { classAcademicId: classId, studentNisList: selectedToAdd },
      {
        onSuccess: () => {
          setSelectedToAdd([]);
          close();
        },
      },
    );
  };

  const handleSelectToAdd = (nis: string, checked: boolean) => {
    if (checked) {
      setSelectedToAdd((prev) => [...prev, nis]);
    } else {
      setSelectedToAdd((prev) => prev.filter((n) => n !== nis));
    }
  };

  const handleSelectAllToAdd = (checked: boolean) => {
    if (checked && unassignedData) {
      setSelectedToAdd(unassignedData.students.map((s) => s.nis));
    } else {
      setSelectedToAdd([]);
    }
  };

  return (
    <>
      <PageHeader
        title={data ? `Students - ${data.class.className}` : "Class Students"}
        description={
          data
            ? `${data.totalStudents} student(s) enrolled in ${data.class.academicYear}`
            : "Manage students in this class"
        }
        actions={
          <Group gap="sm">
            <Button
              variant="light"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => router.push("/classes")}
            >
              Back to Classes
            </Button>
            <Button leftSection={<IconPlus size={18} />} onClick={open}>
              Add Students
            </Button>
          </Group>
        }
      />

      {/* Action Bar */}
      {selectedStudents.length > 0 && (
        <Paper withBorder p="sm" mb="md" bg="red.0">
          <Group justify="space-between">
            <Text size="sm">{selectedStudents.length} student(s) selected</Text>
            <Button
              size="sm"
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={handleRemoveSelected}
              loading={removeStudents.isPending}
            >
              Remove from Class
            </Button>
          </Group>
        </Paper>
      )}

      {/* Students Table */}
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={40}>
                <Checkbox
                  checked={
                    data &&
                    data.students.length > 0 &&
                    selectedStudents.length === data.students.length
                  }
                  indeterminate={
                    selectedStudents.length > 0 &&
                    data &&
                    selectedStudents.length < data.students.length
                  }
                  onChange={(e) => handleSelectAll(e.currentTarget.checked)}
                />
              </Table.Th>
              <Table.Th>NIS</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Parent</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Join Date</Table.Th>
              <Table.Th>Enrolled At</Table.Th>
              <Table.Th w={80}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <Table.Tr key={`skeleton-${i}`}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <Table.Td key={`skeleton-cell-${j}`}>
                      <Skeleton height={20} />
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            {!isLoading && data?.students.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Stack align="center" gap="md" py="xl">
                    <IconUsers size={48} color="gray" />
                    <Text ta="center" c="dimmed">
                      No students in this class yet.
                      <br />
                      Click "Add Students" to assign students.
                    </Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            )}
            {data?.students.map((student) => (
              <Table.Tr key={student.nis}>
                <Table.Td>
                  <Checkbox
                    checked={selectedStudents.includes(student.nis)}
                    onChange={(e) =>
                      handleSelectStudent(student.nis, e.currentTarget.checked)
                    }
                  />
                </Table.Td>
                <Table.Td>
                  <Badge variant="light">{student.nis}</Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {student.name}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{student.parentName}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{student.parentPhone}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {dayjs(student.startJoinDate).format("DD/MM/YYYY")}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {dayjs(student.enrolledAt).format("DD/MM/YYYY")}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Tooltip label="Remove from class">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => {
                        modals.openConfirmModal({
                          title: "Remove Student",
                          children: (
                            <Text size="sm">
                              Remove <strong>{student.name}</strong> from this
                              class?
                            </Text>
                          ),
                          labels: { confirm: "Remove", cancel: "Cancel" },
                          confirmProps: { color: "red" },
                          onConfirm: () => {
                            removeStudents.mutate({
                              classAcademicId: classId,
                              studentNisList: [student.nis],
                            });
                          },
                        });
                      }}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Add Students Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title="Add Students to Class"
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            placeholder="Search students by name or NIS..."
            leftSection={<IconSearch size={16} />}
            value={searchUnassigned}
            onChange={(e) => setSearchUnassigned(e.currentTarget.value)}
          />

          <Paper withBorder>
            <ScrollArea h={400}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={40}>
                      <Checkbox
                        checked={
                          unassignedData &&
                          unassignedData.students.length > 0 &&
                          selectedToAdd.length ===
                            unassignedData.students.length
                        }
                        indeterminate={
                          selectedToAdd.length > 0 &&
                          unassignedData &&
                          selectedToAdd.length < unassignedData.students.length
                        }
                        onChange={(e) =>
                          handleSelectAllToAdd(e.currentTarget.checked)
                        }
                      />
                    </Table.Th>
                    <Table.Th>NIS</Table.Th>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Join Date</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {loadingUnassigned &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <Table.Tr key={`skeleton-${i}`}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <Table.Td key={`skeleton-cell-${j}`}>
                            <Skeleton height={20} />
                          </Table.Td>
                        ))}
                      </Table.Tr>
                    ))}
                  {!loadingUnassigned &&
                    unassignedData?.students.length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={4}>
                          <Text ta="center" c="dimmed" py="md">
                            No unassigned students found
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  {unassignedData?.students.map((student) => (
                    <Table.Tr key={student.nis}>
                      <Table.Td>
                        <Checkbox
                          checked={selectedToAdd.includes(student.nis)}
                          onChange={(e) =>
                            handleSelectToAdd(
                              student.nis,
                              e.currentTarget.checked,
                            )
                          }
                        />
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" size="sm">
                          {student.nis}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{student.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {dayjs(student.startJoinDate).format("DD/MM/YYYY")}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Paper>

          {selectedToAdd.length > 0 && (
            <Text size="sm" c="dimmed">
              {selectedToAdd.length} student(s) selected
            </Text>
          )}

          <Group justify="flex-end">
            <Button variant="light" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={handleAddStudents}
              loading={assignStudents.isPending}
              disabled={selectedToAdd.length === 0}
            >
              Add {selectedToAdd.length > 0 ? `(${selectedToAdd.length})` : ""}{" "}
              Students
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
