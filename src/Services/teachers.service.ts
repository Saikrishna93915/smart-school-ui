import { apiClient } from '../contexts/AuthContext'; 
import { Teacher, TeacherCreatePayload, TeacherUpdateDetailsPayload, AssignedClass } from '../types/teacher'; 

const BASE_ENDPOINT = '/admin/teachers';

// --- Interface Definitions ---

interface TeacherUpdateStatusPayload {
    status: 'active' | 'inactive';
}

interface TeacherUpdateClassesPayload {
    assignedClasses: AssignedClass[];
}

export const TeachersService = {
    // 1) POST /api/admin/teachers (Create Teacher + User account)
    async create(payload: TeacherCreatePayload): Promise<Teacher> {
        const res = await apiClient.post(BASE_ENDPOINT, payload);
        return res.data as Teacher;
    },

    // 2) GET /api/admin/teachers (Get all teachers)
    async getAll(): Promise<Teacher[]> {
        const res = await apiClient.get(BASE_ENDPOINT);
        return res.data as Teacher[];
    },

    // 3) GET /api/admin/teachers/:id (Get teacher by ID)
    async getById(id: string): Promise<Teacher> {
        const res = await apiClient.get(`${BASE_ENDPOINT}/${id}`);
        return res.data as Teacher;
    },

    // 4) PUT /api/admin/teachers/:id (Update teacher details - WITHOUT status/classes)
    async update(id: string, payload: TeacherUpdateDetailsPayload): Promise<Teacher> {
        const res = await apiClient.put(`${BASE_ENDPOINT}/${id}`, payload);
        return res.data as Teacher;
    },

    // 5) PUT /api/admin/teachers/:id/status (Activate / Deactivate teacher)
    async updateStatus(id: string, newStatus: 'active' | 'inactive'): Promise<void> {
        const payload: TeacherUpdateStatusPayload = { status: newStatus };
        await apiClient.put(`${BASE_ENDPOINT}/${id}/status`, payload);
    },

    // 6) PUT /api/admin/teachers/:id/assign-classes (Assign / update classes separately)
    // ✅ CRITICAL FIX: accepts array, sends object
    async assignClasses(id: string, classes: AssignedClass[]): Promise<void> {
        const payload: TeacherUpdateClassesPayload = { assignedClasses: classes };
        await apiClient.put(`${BASE_ENDPOINT}/${id}/assign-classes`, payload);
    },

    // 7) DELETE /api/admin/teachers/:id (Soft delete)
    async remove(id: string): Promise<void> {
        await apiClient.delete(`${BASE_ENDPOINT}/${id}`);
    }
};