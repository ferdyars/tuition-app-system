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
  Badge,
  List,
} from "@mantine/core";
import {
  IconDownload,
  IconFileUpload,
  IconCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { useImportScholarships } from "@/hooks/api/useScholarships";

interface ImportResult {
  imported: number;
  skipped: number;
  autoPayments: number;
  errors: Array<{ row: number; error?: string; errors?: string[] }>;
}

export default function ImportScholarshipsPage() {
  const [file, setFile] = useState<File | null>(null);
  const importScholarships = useImportScholarships();
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleDownloadTemplate = () => {
    window.open("/api/v1/scholarships/template", "_blank");
  };

  const handleImport = () => {
    if (!file) return;

    importScholarships.mutate(file, {
      onSuccess: (data) => {
        setResult(data);
        notifications.show({
          title: "Import Complete",
          message: `Imported ${data.imported} scholarships, ${data.autoPayments} tuitions auto-paid`,
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
        title="Import Scholarships"
        description="Import scholarships from Excel file"
      />
      <Paper withBorder p="lg" maw={700}>
        <Stack gap="md">
          <Alert icon={<IconAlertCircle size={18} />} color="blue" variant="light">
            <Text size="sm" fw={500} mb="xs">
              Instructions:
            </Text>
            <List size="sm">
              <List.Item>
                Download the Excel template which includes reference sheets for
                students and classes
              </List.Item>
              <List.Item>
                Fill in Student NIS, Class name (must match exactly), and
                Nominal amount
              </List.Item>
              <List.Item>
                Full scholarships (nominal &gt;= monthly fee) will automatically
                mark unpaid tuitions as paid
              </List.Item>
              <List.Item>
                Existing scholarships for the same student-class combination
                will be skipped
              </List.Item>
            </List>
          </Alert>

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
            loading={importScholarships.isPending}
          >
            Process Import
          </Button>

          {result && (
            <>
              <Alert icon={<IconCheck size={18} />} color="green">
                <Stack gap="xs">
                  <Group gap="md">
                    <Badge color="green" size="lg">
                      Imported: {result.imported}
                    </Badge>
                    <Badge color="gray" size="lg">
                      Skipped: {result.skipped}
                    </Badge>
                    <Badge color="blue" size="lg">
                      Auto-paid: {result.autoPayments} tuitions
                    </Badge>
                  </Group>
                </Stack>
              </Alert>

              {result.errors.length > 0 && (
                <Alert icon={<IconAlertCircle size={18} />} color="red">
                  <Stack gap="xs">
                    <Text size="sm" fw={600}>
                      {result.errors.length} rows had errors:
                    </Text>
                    {result.errors.slice(0, 5).map((err, index) => (
                      <Text key={index} size="sm">
                        Row {err.row}:{" "}
                        {err.error || err.errors?.join(", ") || "Unknown error"}
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
