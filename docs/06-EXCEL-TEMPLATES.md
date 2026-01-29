# Excel Templates - Import/Export System

## Overview

The system uses SheetJS (xlsx) for Excel operations with pre-defined templates that include data validation to prevent human error.

## Excel Utility Functions

### File: `src/lib/excel-utils.ts`

```typescript
import * as XLSX from 'xlsx';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  validation?: {
    type: 'list' | 'date' | 'number' | 'text';
    options?: string[]; // For list validation
    min?: number; // For number validation
    max?: number;
  };
}

export interface ExcelTemplate {
  sheetName: string;
  columns: ExcelColumn[];
  data?: any[];
}

/**
 * Create Excel template with data validation
 */
export function createExcelTemplate(template: ExcelTemplate): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  
  // Create worksheet
  const wsData: any[][] = [];
  
  // Add headers
  const headers = template.columns.map((col) => col.header);
  wsData.push(headers);
  
  // Add sample data if provided
  if (template.data && template.data.length > 0) {
    template.data.forEach((row) => {
      const rowData = template.columns.map((col) => row[col.key] || '');
      wsData.push(rowData);
    });
  } else {
    // Add 100 empty rows for user input
    for (let i = 0; i < 100; i++) {
      wsData.push(template.columns.map(() => ''));
    }
  }
  
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  worksheet['!cols'] = template.columns.map((col) => ({
    wch: col.width || 20,
  }));
  
  // Add data validation (NOTE: SheetJS has limited validation support)
  // For dropdown validation, we'll add a separate sheet with options
  const dropdownColumns = template.columns.filter(
    (col) => col.validation?.type === 'list'
  );
  
  if (dropdownColumns.length > 0) {
    const validationSheet: any = {};
    dropdownColumns.forEach((col, index) => {
      const colLetter = String.fromCharCode(65 + index); // A, B, C, etc.
      col.validation?.options?.forEach((option, rowIndex) => {
        const cellRef = `${colLetter}${rowIndex + 1}`;
        validationSheet[cellRef] = { v: option };
      });
    });
    
    const validationWs = XLSX.utils.json_to_sheet(
      dropdownColumns.reduce((acc, col, index) => {
        col.validation?.options?.forEach((option, i) => {
          if (!acc[i]) acc[i] = {};
          acc[i][col.header] = option;
        });
        return acc;
      }, [] as any[])
    );
    
    XLSX.utils.book_append_sheet(workbook, validationWs, 'Options');
  }
  
  XLSX.utils.book_append_sheet(workbook, worksheet, template.sheetName);
  
  return workbook;
}

/**
 * Download Excel file
 */
export function downloadExcel(workbook: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(workbook, filename);
}

/**
 * Read Excel file
 */
export async function readExcelFile<T = any>(
  file: File
): Promise<{ data: T[]; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Read first sheet
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<T>(firstSheet, {
          raw: false, // Convert dates to strings
          defval: '', // Default value for empty cells
        });
        
        // Basic validation
        const errors: string[] = [];
        if (jsonData.length === 0) {
          errors.push('Excel file is empty');
        }
        
        resolve({ data: jsonData, errors });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Export data to Excel
 */
export function exportToExcel<T>(
  data: T[],
  filename: string,
  sheetName: string = 'Sheet1'
) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

/**
 * Validate Excel data against schema
 */
export function validateExcelData<T>(
  data: any[],
  requiredFields: (keyof T)[],
  rowValidation?: (row: any, index: number) => string | null
): { valid: T[]; errors: Array<{ row: number; errors: string[] }> } {
  const valid: T[] = [];
  const errors: Array<{ row: number; errors: string[] }> = [];
  
  data.forEach((row, index) => {
    const rowErrors: string[] = [];
    
    // Check required fields
    requiredFields.forEach((field) => {
      if (!row[field] || row[field] === '') {
        rowErrors.push(`${String(field)} is required`);
      }
    });
    
    // Custom validation
    if (rowValidation) {
      const customError = rowValidation(row, index);
      if (customError) {
        rowErrors.push(customError);
      }
    }
    
    if (rowErrors.length > 0) {
      errors.push({ row: index + 2, errors: rowErrors }); // +2 for header and 0-index
    } else {
      valid.push(row as T);
    }
  });
  
  return { valid, errors };
}
```

## Template Definitions

### Student Import Template

```typescript
// src/lib/excel-templates/student-template.ts

import { createExcelTemplate, ExcelColumn } from '../excel-utils';

export interface StudentExcelRow {
  NIS: string;
  NIK: string;
  'Student Name': string;
  Address: string;
  'Parent Name': string;
  'Parent Phone': string;
  'Start Join Date': string; // Format: YYYY-MM-DD
}

export function createStudentTemplate() {
  const columns: ExcelColumn[] = [
    {
      header: 'NIS',
      key: 'NIS',
      width: 15,
      validation: { type: 'text' },
    },
    {
      header: 'NIK',
      key: 'NIK',
      width: 20,
      validation: { type: 'text' },
    },
    {
      header: 'Student Name',
      key: 'Student Name',
      width: 25,
      validation: { type: 'text' },
    },
    {
      header: 'Address',
      key: 'Address',
      width: 40,
      validation: { type: 'text' },
    },
    {
      header: 'Parent Name',
      key: 'Parent Name',
      width: 25,
      validation: { type: 'text' },
    },
    {
      header: 'Parent Phone',
      key: 'Parent Phone',
      width: 15,
      validation: { type: 'text' },
    },
    {
      header: 'Start Join Date',
      key: 'Start Join Date',
      width: 15,
      validation: { type: 'date' },
    },
  ];
  
  return createExcelTemplate({
    sheetName: 'Students',
    columns,
    data: [
      {
        NIS: '2024001',
        NIK: '3578123456789012',
        'Student Name': 'Ahmad Rizki',
        Address: 'Jl. Merdeka No. 123',
        'Parent Name': 'Budi Santoso',
        'Parent Phone': '081234567890',
        'Start Join Date': '2024-07-01',
      },
    ],
  });
}

export function validateStudentData(data: any[]) {
  return validateExcelData<StudentExcelRow>(
    data,
    ['NIS', 'NIK', 'Student Name', 'Address', 'Parent Name', 'Parent Phone', 'Start Join Date'],
    (row, index) => {
      // Validate NIK length
      if (row.NIK && row.NIK.length !== 16) {
        return 'NIK must be 16 digits';
      }
      
      // Validate date format
      if (row['Start Join Date'] && !/^\d{4}-\d{2}-\d{2}$/.test(row['Start Join Date'])) {
        return 'Start Join Date must be in YYYY-MM-DD format';
      }
      
      // Validate phone
      if (row['Parent Phone'] && row['Parent Phone'].length < 10) {
        return 'Parent Phone must be at least 10 digits';
      }
      
      return null;
    }
  );
}
```

### Class Academic Import Template

```typescript
// src/lib/excel-templates/class-template.ts

export interface ClassExcelRow {
  'Academic Year': string; // Dropdown
  Grade: number; // Dropdown 1-12
  Section: string;
}

export function createClassTemplate(academicYears: string[]) {
  const columns: ExcelColumn[] = [
    {
      header: 'Academic Year',
      key: 'Academic Year',
      width: 20,
      validation: {
        type: 'list',
        options: academicYears, // e.g., ['2024/2025', '2025/2026']
      },
    },
    {
      header: 'Grade',
      key: 'Grade',
      width: 10,
      validation: {
        type: 'list',
        options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      },
    },
    {
      header: 'Section',
      key: 'Section',
      width: 15,
      validation: { type: 'text' },
    },
  ];
  
  return createExcelTemplate({
    sheetName: 'Classes',
    columns,
    data: [
      {
        'Academic Year': academicYears[0] || '2024/2025',
        Grade: 12,
        Section: 'IPA',
      },
      {
        'Academic Year': academicYears[0] || '2024/2025',
        Grade: 12,
        Section: 'IPS',
      },
    ],
  });
}

export function validateClassData(data: any[]) {
  return validateExcelData<ClassExcelRow>(
    data,
    ['Academic Year', 'Grade', 'Section'],
    (row, index) => {
      // Validate grade range
      const grade = parseInt(row.Grade);
      if (isNaN(grade) || grade < 1 || grade > 12) {
        return 'Grade must be between 1 and 12';
      }
      
      return null;
    }
  );
}
```

### Scholarship Import Template

```typescript
// src/lib/excel-templates/scholarship-template.ts

export interface ScholarshipExcelRow {
  'Student NIS': string; // Dropdown
  'Class Academic': string; // Dropdown (format: XII-IPA-2024/2025)
  Nominal: number;
}

export function createScholarshipTemplate(
  students: Array<{ nis: string; name: string }>,
  classes: Array<{ id: string; className: string }>
) {
  const columns: ExcelColumn[] = [
    {
      header: 'Student NIS',
      key: 'Student NIS',
      width: 20,
      validation: {
        type: 'list',
        options: students.map((s) => `${s.nis} - ${s.name}`),
      },
    },
    {
      header: 'Class Academic',
      key: 'Class Academic',
      width: 30,
      validation: {
        type: 'list',
        options: classes.map((c) => c.className),
      },
    },
    {
      header: 'Nominal',
      key: 'Nominal',
      width: 15,
      validation: {
        type: 'number',
        min: 0,
      },
    },
  ];
  
  return createExcelTemplate({
    sheetName: 'Scholarships',
    columns,
    data: [
      {
        'Student NIS': students[0] ? `${students[0].nis} - ${students[0].name}` : '',
        'Class Academic': classes[0]?.className || '',
        Nominal: 500000,
      },
    ],
  });
}

export function validateScholarshipData(
  data: any[],
  students: Array<{ nis: string }>,
  classes: Array<{ className: string }>
) {
  const validNis = students.map((s) => s.nis);
  const validClasses = classes.map((c) => c.className);
  
  return validateExcelData<ScholarshipExcelRow>(
    data,
    ['Student NIS', 'Class Academic', 'Nominal'],
    (row, index) => {
      // Extract NIS from "NIS - Name" format
      const nis = row['Student NIS'].split(' - ')[0];
      if (!validNis.includes(nis)) {
        return 'Invalid Student NIS';
      }
      
      if (!validClasses.includes(row['Class Academic'])) {
        return 'Invalid Class Academic';
      }
      
      const nominal = parseFloat(row.Nominal);
      if (isNaN(nominal) || nominal < 0) {
        return 'Nominal must be a positive number';
      }
      
      return null;
    }
  );
}
```

## Excel Upload Component

### File: `src/components/ui/ExcelUploader/ExcelUploader.tsx`

```typescript
'use client';

import { useState } from 'react';
import { FileInput, Button, Stack, Alert, Progress, Text, Group } from '@mantine/core';
import { IconFileUpload, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { readExcelFile } from '@/lib/excel-utils';

interface ExcelUploaderProps<T> {
  onUpload: (data: T[]) => Promise<void>;
  validator?: (data: any[]) => {
    valid: T[];
    errors: Array<{ row: number; errors: string[] }>;
  };
  accept?: string;
}

export function ExcelUploader<T>({
  onUpload,
  validator,
  accept = '.xlsx,.xls',
}: ExcelUploaderProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    errors: Array<{ row: number; errors: string[] }>;
  } | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setUploadResult(null);

    try {
      const { data, errors: readErrors } = await readExcelFile(file);

      if (readErrors.length > 0) {
        throw new Error(readErrors.join(', '));
      }

      let validData = data;
      let validationErrors: Array<{ row: number; errors: string[] }> = [];

      if (validator) {
        const result = validator(data);
        validData = result.valid;
        validationErrors = result.errors;
      }

      if (validData.length > 0) {
        await onUpload(validData);
      }

      setUploadResult({
        success: validData.length,
        errors: validationErrors,
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: 0,
        errors: [{ row: 0, errors: [(error as Error).message] }],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Stack gap="md">
      <FileInput
        label="Upload Excel File"
        placeholder="Choose file"
        accept={accept}
        value={file}
        onChange={setFile}
        leftSection={<IconFileUpload size={18} />}
      />

      <Button
        onClick={handleUpload}
        disabled={!file}
        loading={isProcessing}
      >
        Process Import
      </Button>

      {isProcessing && (
        <Progress value={100} animated />
      )}

      {uploadResult && (
        <>
          {uploadResult.success > 0 && (
            <Alert icon={<IconCheck size={18} />} color="green">
              Successfully imported {uploadResult.success} records
            </Alert>
          )}

          {uploadResult.errors.length > 0 && (
            <Alert icon={<IconAlertCircle size={18} />} color="red">
              <Stack gap="xs">
                <Text fw={600}>
                  {uploadResult.errors.length} rows have errors:
                </Text>
                {uploadResult.errors.slice(0, 5).map((error, index) => (
                  <Text key={index} size="sm">
                    Row {error.row}: {error.errors.join(', ')}
                  </Text>
                ))}
                {uploadResult.errors.length > 5 && (
                  <Text size="sm" c="dimmed">
                    ... and {uploadResult.errors.length - 5} more errors
                  </Text>
                )}
              </Stack>
            </Alert>
          )}
        </>
      )}
    </Stack>
  );
}
```

## Usage Examples

### Student Import Page

```typescript
'use client';

import { Button, Paper, Stack, Title } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { ExcelUploader } from '@/components/ui/ExcelUploader/ExcelUploader';
import { useImportStudents } from '@/hooks/api/useStudents';
import {
  createStudentTemplate,
  validateStudentData,
  type StudentExcelRow,
} from '@/lib/excel-templates/student-template';
import { downloadExcel } from '@/lib/excel-utils';

export default function StudentImportPage() {
  const importMutation = useImportStudents();

  const handleDownloadTemplate = () => {
    const template = createStudentTemplate();
    downloadExcel(template, 'student-import-template.xlsx');
  };

  const handleImport = async (data: StudentExcelRow[]) => {
    // Transform data to match API format
    const students = data.map((row) => ({
      nis: row.NIS,
      nik: row.NIK,
      name: row['Student Name'],
      address: row.Address,
      parentName: row['Parent Name'],
      parentPhone: row['Parent Phone'],
      startJoinDate: new Date(row['Start Join Date']),
    }));

    await importMutation.mutateAsync(students);
  };

  return (
    <Paper p="lg">
      <Stack gap="lg">
        <Title order={2}>Import Students</Title>

        <Button
          leftSection={<IconDownload size={18} />}
          onClick={handleDownloadTemplate}
          variant="light"
        >
          Download Excel Template
        </Button>

        <ExcelUploader
          onUpload={handleImport}
          validator={validateStudentData}
        />
      </Stack>
    </Paper>
  );
}
```

## Excel Export with Filters

```typescript
// Hook for exporting with current filters
export function useExportWithFilters() {
  const exportMutation = useExportStudents();

  const handleExport = async (filters: StudentFilters) => {
    const blob = await exportMutation.mutateAsync(filters);
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return { handleExport, isExporting: exportMutation.isPending };
}
```
