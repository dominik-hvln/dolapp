import { api } from '@/lib/api';

export interface EmployeeDocument {
    id: string;
    user_id: string;
    display_name: string;
    file_name: string;
    mime_type: 'image/jpeg' | 'image/png' | 'application/pdf';
    size_bytes: number;
    uploaded_by: string | null;
    uploaded_by_name: string | null;
    created_at: string;
    updated_at: string;
}

export const employeeDocumentsApi = {
    list: async (userId: string) => {
        const { data } = await api.get<EmployeeDocument[]>(`/employee-documents/users/${userId}`);
        return data;
    },
    upload: async (userId: string, file: File, name?: string, onProgress?: (percent: number) => void) => {
        const body = new FormData();
        body.append('file', file);
        if (name?.trim()) body.append('name', name.trim());
        const { data } = await api.post<EmployeeDocument>(`/employee-documents/users/${userId}`, body, {
            onUploadProgress: ({ loaded, total }) => {
                if (total) onProgress?.(Math.min(100, Math.round(loaded * 100 / total)));
            },
        });
        return data;
    },
    rename: async (id: string, name: string) => {
        const { data } = await api.patch<EmployeeDocument>(`/employee-documents/${id}`, { name });
        return data;
    },
    remove: async (id: string) => {
        const { data } = await api.delete<{ deleted: boolean }>(`/employee-documents/${id}`);
        return data;
    },
    getUrl: async (id: string) => {
        const { data } = await api.get<{ url: string; expiresAt: string }>(`/employee-documents/${id}/url`);
        return data;
    },
};
