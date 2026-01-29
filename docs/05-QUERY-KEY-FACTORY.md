# TanStack Query - Query Key Factory Pattern

## Query Key Factory

Centralized query key management for type-safe and organized cache invalidation.

### File: `src/lib/query-keys.ts`

```typescript
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },

  // Employees
  employees: {
    all: ['employees'] as const,
    lists: () => [...queryKeys.employees.all, 'list'] as const,
    list: (filters: EmployeeFilters) =>
      [...queryKeys.employees.lists(), filters] as const,
    details: () => [...queryKeys.employees.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.employees.details(), id] as const,
  },

  // Students
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (filters: StudentFilters) =>
      [...queryKeys.students.lists(), filters] as const,
    details: () => [...queryKeys.students.all, 'detail'] as const,
    detail: (nis: string) => [...queryKeys.students.details(), nis] as const,
  },

  // Academic Years
  academicYears: {
    all: ['academic-years'] as const,
    lists: () => [...queryKeys.academicYears.all, 'list'] as const,
    list: (filters: AcademicYearFilters) =>
      [...queryKeys.academicYears.lists(), filters] as const,
    details: () => [...queryKeys.academicYears.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.academicYears.details(), id] as const,
    active: () => [...queryKeys.academicYears.all, 'active'] as const,
  },

  // Class Academics
  classAcademics: {
    all: ['class-academics'] as const,
    lists: () => [...queryKeys.classAcademics.all, 'list'] as const,
    list: (filters: ClassAcademicFilters) =>
      [...queryKeys.classAcademics.lists(), filters] as const,
    details: () => [...queryKeys.classAcademics.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.classAcademics.details(), id] as const,
    byYear: (yearId: string) =>
      [...queryKeys.classAcademics.all, 'by-year', yearId] as const,
  },

  // Tuitions
  tuitions: {
    all: ['tuitions'] as const,
    lists: () => [...queryKeys.tuitions.all, 'list'] as const,
    list: (filters: TuitionFilters) =>
      [...queryKeys.tuitions.lists(), filters] as const,
    details: () => [...queryKeys.tuitions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tuitions.details(), id] as const,
    byStudent: (nis: string) =>
      [...queryKeys.tuitions.all, 'by-student', nis] as const,
    byClass: (classId: string) =>
      [...queryKeys.tuitions.all, 'by-class', classId] as const,
    unpaid: () => [...queryKeys.tuitions.all, 'unpaid'] as const,
  },

  // Scholarships
  scholarships: {
    all: ['scholarships'] as const,
    lists: () => [...queryKeys.scholarships.all, 'list'] as const,
    list: (filters: ScholarshipFilters) =>
      [...queryKeys.scholarships.lists(), filters] as const,
    details: () => [...queryKeys.scholarships.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.scholarships.details(), id] as const,
    byStudent: (nis: string) =>
      [...queryKeys.scholarships.all, 'by-student', nis] as const,
  },

  // Payments
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (filters: PaymentFilters) =>
      [...queryKeys.payments.lists(), filters] as const,
    details: () => [...queryKeys.payments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
    byTuition: (tuitionId: string) =>
      [...queryKeys.payments.all, 'by-tuition', tuitionId] as const,
  },

  // Reports
  reports: {
    all: ['reports'] as const,
    overdue: (filters: OverdueFilters) =>
      [...queryKeys.reports.all, 'overdue', filters] as const,
    classSummary: (filters: ClassSummaryFilters) =>
      [...queryKeys.reports.all, 'class-summary', filters] as const,
    paymentHistory: (filters: PaymentHistoryFilters) =>
      [...queryKeys.reports.all, 'payment-history', filters] as const,
  },
} as const;

// Type definitions for filters
export interface EmployeeFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'ADMIN' | 'CASHIER';
}

export interface StudentFilters {
  page?: number;
  limit?: number;
  search?: string;
  startJoinDateFrom?: string;
  startJoinDateTo?: string;
}

export interface AcademicYearFilters {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export interface ClassAcademicFilters {
  page?: number;
  limit?: number;
  academicYearId?: string;
  grade?: number;
  search?: string;
}

export interface TuitionFilters {
  page?: number;
  limit?: number;
  classAcademicId?: string;
  studentNis?: string;
  status?: 'UNPAID' | 'PAID' | 'PARTIAL';
  month?: string;
  year?: number;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface ScholarshipFilters {
  page?: number;
  limit?: number;
  classAcademicId?: string;
  studentNis?: string;
  isFullScholarship?: boolean;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  studentNis?: string;
  classAcademicId?: string;
  employeeId?: string;
  paymentDateFrom?: string;
  paymentDateTo?: string;
}

export interface OverdueFilters {
  classAcademicId?: string;
  grade?: number;
  academicYearId?: string;
}

export interface ClassSummaryFilters {
  academicYearId?: string;
}

export interface PaymentHistoryFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  classAcademicId?: string;
}
```

## API Hooks Implementation

### useEmployees Hook (`hooks/api/useEmployees.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type EmployeeFilters } from '@/lib/query-keys';
import { apiClient } from '@/lib/api-client';
import { Employee } from '@/types';

// List employees
export function useEmployees(filters: EmployeeFilters = {}) {
  return useQuery({
    queryKey: queryKeys.employees.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get('/employees', { params: filters });
      return data.data;
    },
  });
}

// Get single employee
export function useEmployee(id: string) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get(`/employees/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

// Create employee
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newEmployee: Omit<Employee, 'employeeId'>) => {
      const { data } = await apiClient.post('/employees', newEmployee);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
    },
  });
}

// Update employee
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Employee>;
    }) => {
      const { data } = await apiClient.put(`/employees/${id}`, updates);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.employees.detail(variables.id),
      });
    },
  });
}

// Delete employee
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
    },
  });
}

// Reset password
export function useResetEmployeePassword() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/employees/${id}/reset-password`);
      return data.data;
    },
  });
}
```

### useStudents Hook (`hooks/api/useStudents.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type StudentFilters } from '@/lib/query-keys';
import { apiClient } from '@/lib/api-client';
import { Student } from '@/types';

export function useStudents(filters: StudentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.students.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get('/students', { params: filters });
      return data.data;
    },
  });
}

export function useStudent(nis: string) {
  return useQuery({
    queryKey: queryKeys.students.detail(nis),
    queryFn: async () => {
      const { data } = await apiClient.get(`/students/${nis}`);
      return data.data;
    },
    enabled: !!nis,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newStudent: Omit<Student, 'createdAt' | 'updatedAt'>) => {
      const { data } = await apiClient.post('/students', newStudent);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nis,
      updates,
    }: {
      nis: string;
      updates: Partial<Student>;
    }) => {
      const { data } = await apiClient.put(`/students/${nis}`, updates);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.students.detail(variables.nis),
      });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nis: string) => {
      await apiClient.delete(`/students/${nis}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
    },
  });
}

export function useImportStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post('/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
    },
  });
}

export function useExportStudents() {
  return useMutation({
    mutationFn: async (filters: StudentFilters) => {
      const { data } = await apiClient.post(
        '/students/export',
        { filters },
        { responseType: 'blob' }
      );
      return data;
    },
  });
}
```

### useTuitions Hook (`hooks/api/useTuitions.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type TuitionFilters } from '@/lib/query-keys';
import { apiClient } from '@/lib/api-client';

export function useTuitions(filters: TuitionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.tuitions.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get('/tuitions', { params: filters });
      return data.data;
    },
  });
}

export function useGenerateTuitions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      classAcademicId: string;
      feeAmount: number;
      studentNisList?: string[];
      startMonth?: string;
      startYear?: number;
    }) => {
      const { data } = await apiClient.post('/tuitions/generate', params);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tuitions.lists() });
    },
  });
}

export function useGenerateTuitionsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      classes: Array<{
        classAcademicId: string;
        feeAmount: number;
      }>;
    }) => {
      const { data } = await apiClient.post('/tuitions/generate-bulk', params);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tuitions.lists() });
    },
  });
}
```

### usePayments Hook (`hooks/api/usePayments.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type PaymentFilters } from '@/lib/query-keys';
import { apiClient } from '@/lib/api-client';

export function usePayments(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.payments.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get('/payments', { params: filters });
      return data.data;
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: {
      tuitionId: string;
      amount: number;
      notes?: string;
    }) => {
      const { data } = await apiClient.post('/payments', payment);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tuitions.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments.byTuition(variables.tuitionId),
      });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/payments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tuitions.lists() });
    },
  });
}
```

### useReports Hook (`hooks/api/useReports.ts`)

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys, type OverdueFilters } from '@/lib/query-keys';
import { apiClient } from '@/lib/api-client';

export function useOverdueReport(filters: OverdueFilters = {}) {
  return useQuery({
    queryKey: queryKeys.reports.overdue(filters),
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/overdue', {
        params: filters,
      });
      return data.data;
    },
  });
}

export function useExportOverdueReport() {
  return useMutation({
    mutationFn: async (filters: OverdueFilters) => {
      const { data } = await apiClient.get('/reports/overdue/export', {
        params: filters,
        responseType: 'blob',
      });
      return data;
    },
  });
}

export function useClassSummaryReport(filters: { academicYearId?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.reports.classSummary(filters),
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/class-summary', {
        params: filters,
      });
      return data.data;
    },
  });
}
```

## Cache Invalidation Examples

### After Creating Student
```typescript
// Automatically handled in useCreateStudent
queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
```

### After Payment
```typescript
// Invalidate multiple related queries
queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
queryClient.invalidateQueries({ queryKey: queryKeys.tuitions.lists() });
queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
```

### Manual Invalidation
```typescript
// Invalidate all employees
queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });

// Invalidate specific employee
queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail('uuid') });

// Invalidate all lists but not details
queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
```

## Prefetching

```typescript
// Prefetch next page
const prefetchNextPage = async (currentPage: number, filters: StudentFilters) => {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.students.list({ ...filters, page: currentPage + 1 }),
    queryFn: async () => {
      const { data } = await apiClient.get('/students', {
        params: { ...filters, page: currentPage + 1 },
      });
      return data.data;
    },
  });
};
```

## Optimistic Updates

```typescript
export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nis, updates }: { nis: string; updates: Partial<Student> }) => {
      const { data } = await apiClient.put(`/students/${nis}`, updates);
      return data.data;
    },
    // Optimistic update
    onMutate: async ({ nis, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.students.detail(nis) });
      
      const previousStudent = queryClient.getQueryData(queryKeys.students.detail(nis));
      
      queryClient.setQueryData(queryKeys.students.detail(nis), (old: any) => ({
        ...old,
        ...updates,
      }));
      
      return { previousStudent };
    },
    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        queryKeys.students.detail(variables.nis),
        context?.previousStudent
      );
    },
    // Refetch on success or error
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(variables.nis) });
    },
  });
}
```
