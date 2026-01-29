"use client";

import { useState } from "react";
import {
  Paper,
  Stack,
  Button,
  FileInput,
  Alert,
  Text,
  Group,
} from "@mantine/core";
import {
  IconDownload,
  IconFileUpload,
  IconCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { useImportStudents } from "@/hooks/api/useStudents";

export default function ImportStudentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const importStudents = useImportStudents();
  const [result, setResult] = useState<{
    imported: number;
    updated: number;
    errors: unknown[];
  } | null>(null);

  const handleDownloadTemplate = () => {
    window.open("/api/v1/students/template", "_blank");
  };

  const handleImport = () => {
    if (!file) return;

    importStudents.mutate(file, {
      onSuccess: (data) => {
        setResult(data);
        notifications.show({
          title: "Import Complete",
          message: `Imported ${data.imported}, updated ${data.updated} students`,
          color: "green",
        });
        setFile(null);
      },
      onError: (error) => {
        notifications.show({
          title: "Import Failed",
          message: error.message,
          color: "red",
        });
      },
    });
  };

  return (
    <>
      <PageHeader
        title="Import Students"
        description="Import student records from Excel file"
      />
      <Paper withBorder p="lg" maw={600}>
        <Stack gap="md">
          <Button
            leftSection={<IconDownload size={18} />}
            variant="light"
            onClick={handleDownloadTemplate}
          >
            Download Excel Template
          </Button>

          <FileInput
            label="Upload Excel File"
            placeholder="Choose .xlsx file"
            accept=".xlsx,.xls"
            value={file}
            onChange={setFile}
            leftSection={<IconFileUpload size={18} />}
          />

          <Button
            onClick={handleImport}
            disabled={!file}
            loading={importStudents.isPending}
          >
            Process Import
          </Button>

          {result && (
            <>
              {(result.imported > 0 || result.updated > 0) && (
                <Alert icon={<IconCheck size={18} />} color="green">
                  <Group gap="xs">
                    <Text size="sm">
                      Imported: {result.imported}, Updated: {result.updated}
                    </Text>
                  </Group>
                </Alert>
              )}
              {result.errors.length > 0 && (
                <Alert icon={<IconAlertCircle size={18} />} color="red">
                  <Text size="sm" fw={600}>
                    {result.errors.length} rows had errors
                  </Text>
                </Alert>
              )}
            </>
          )}
        </Stack>
      </Paper>
    </>
  );
}
