"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Alert,
  Table,
  Badge,
  FileInput,
  Select,
} from "@mantine/core";
import {
  IconUpload,
  IconDownload,
  IconArrowLeft,
  IconAlertCircle,
  IconCheck,
} from "@tabler/icons-react";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { useAcademicYears } from "@/hooks/api/useAcademicYears";
import {
  useImportStudentClasses,
  useDownloadStudentClassTemplate,
} from "@/hooks/api/useStudentClasses";

interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
  errors: Array<{ row: number; nis: string; error: string }>;
}

export default function ImportStudentClassesPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const { data: academicYearsData } = useAcademicYears({ limit: 100 });
  const activeYear = academicYearsData?.academicYears.find((ay) => ay.isActive);

  const importMutation = useImportStudentClasses();
  const { downloadTemplate } = useDownloadStudentClassTemplate();

  const handleImport = async () => {
    if (!file) return;

    const response = await importMutation.mutateAsync(file);
    setResult(response.data);
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(academicYearId || activeYear?.id);
  };

  const yearOptions =
    academicYearsData?.academicYears.map((ay) => ({
      value: ay.id,
      label: ay.year + (ay.isActive ? " (Active)" : ""),
    })) || [];

  return (
    <>
      <PageHeader
        title="Import Student Class Assignments"
        description="Bulk assign students to classes using Excel"
        actions={
          <Button
            variant="light"
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => router.push("/classes")}
          >
            Back to Classes
          </Button>
        }
      />

      <Stack gap="md">
        <Paper withBorder p="md">
          <Stack gap="md">
            <Text fw={600}>Step 1: Download Template</Text>
            <Text size="sm" c="dimmed">
              Download the template with a list of students and classes for reference.
            </Text>
            <Group>
              <Select
                placeholder="Select academic year for classes"
                data={yearOptions}
                value={academicYearId}
                onChange={setAcademicYearId}
                clearable
                w={250}
              />
              <Button
                variant="light"
                leftSection={<IconDownload size={18} />}
                onClick={handleDownloadTemplate}
              >
                Download Template
              </Button>
            </Group>
          </Stack>
        </Paper>

        <Paper withBorder p="md">
          <Stack gap="md">
            <Text fw={600}>Step 2: Upload Filled Template</Text>
            <Text size="sm" c="dimmed">
              Fill in the template with Student NIS and Class Name, then upload.
            </Text>
            <Group>
              <FileInput
                placeholder="Select Excel file"
                accept=".xlsx,.xls"
                value={file}
                onChange={setFile}
                w={300}
              />
              <Button
                leftSection={<IconUpload size={18} />}
                onClick={handleImport}
                loading={importMutation.isPending}
                disabled={!file}
              >
                Import
              </Button>
            </Group>
          </Stack>
        </Paper>

        {result && (
          <Paper withBorder p="md">
            <Stack gap="md">
              <Text fw={600}>Import Results</Text>

              <Group gap="xl">
                <Group gap="xs">
                  <Badge color="green" size="lg" leftSection={<IconCheck size={14} />}>
                    Imported: {result.imported}
                  </Badge>
                </Group>
                <Group gap="xs">
                  <Badge color="yellow" size="lg">
                    Skipped: {result.skipped}
                  </Badge>
                </Group>
                <Group gap="xs">
                  <Badge color="red" size="lg">
                    Errors: {result.errors.length}
                  </Badge>
                </Group>
              </Group>

              {result.errors.length > 0 && (
                <>
                  <Alert
                    icon={<IconAlertCircle size={18} />}
                    title="Import Errors"
                    color="red"
                  >
                    Some rows could not be imported. See details below.
                  </Alert>

                  <Table striped>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Row</Table.Th>
                        <Table.Th>NIS</Table.Th>
                        <Table.Th>Error</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {result.errors.slice(0, 50).map((err, i) => (
                        <Table.Tr key={`error-${i}`}>
                          <Table.Td>{err.row || "-"}</Table.Td>
                          <Table.Td>{err.nis || "-"}</Table.Td>
                          <Table.Td>
                            <Text size="sm" c="red">
                              {err.error}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>

                  {result.errors.length > 50 && (
                    <Text size="sm" c="dimmed">
                      Showing first 50 errors of {result.errors.length}
                    </Text>
                  )}
                </>
              )}
            </Stack>
          </Paper>
        )}
      </Stack>
    </>
  );
}
