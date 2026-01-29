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
import { useImportClassAcademics } from "@/hooks/api/useClassAcademics";

export default function ImportClassesPage() {
  const [file, setFile] = useState<File | null>(null);
  const importClasses = useImportClassAcademics();
  const [result, setResult] = useState<{
    imported: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);

  const handleDownloadTemplate = () => {
    window.open("/api/v1/class-academics/template", "_blank");
  };

  const handleImport = () => {
    if (!file) return;

    importClasses.mutate(file, {
      onSuccess: (data) => {
        setResult(data);
        notifications.show({
          title: "Import Complete",
          message: `Imported ${data.imported} classes`,
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
        title="Import Classes"
        description="Import academic classes from Excel file"
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
            loading={importClasses.isPending}
          >
            Process Import
          </Button>

          {result && (
            <>
              {result.imported > 0 && (
                <Alert icon={<IconCheck size={18} />} color="green">
                  <Group gap="xs">
                    <Text size="sm">Imported: {result.imported} classes</Text>
                  </Group>
                </Alert>
              )}
              {result.errors.length > 0 && (
                <Alert icon={<IconAlertCircle size={18} />} color="red">
                  <Stack gap="xs">
                    <Text size="sm" fw={600}>
                      {result.errors.length} rows had errors:
                    </Text>
                    {result.errors.slice(0, 5).map((err) => (
                      <Text key={err.row} size="sm">
                        Row {err.row}: {err.error}
                      </Text>
                    ))}
                    {result.errors.length > 5 && (
                      <Text size="sm" c="dimmed">
                        ... and {result.errors.length - 5} more errors
                      </Text>
                    )}
                  </Stack>
                </Alert>
              )}
            </>
          )}
        </Stack>
      </Paper>
    </>
  );
}
