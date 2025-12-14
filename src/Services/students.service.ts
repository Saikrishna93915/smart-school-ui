// Services/students.service.ts

import { apiClient } from '../contexts/AuthContext'; // ADJUST PATH if necessary
import { Student, StudentCreatePayload } from '../types/student'; // Ensure types/student.ts exists

const BASE_ENDPOINT = "/admin/students"; 

export const StudentsService = {
  // GET /admin/students
  getAll: async (): Promise<Student[]> => {
    const res = await apiClient.get(BASE_ENDPOINT);
    return res.data as Student[];
  },

  // GET /admin/students/:id
  getById: async (id: string): Promise<Student> => {
    const res = await apiClient.get(`${BASE_ENDPOINT}/${id}`);
    return res.data as Student;
  },

  // POST /admin/students
  create: async (payload: StudentCreatePayload): Promise<Student> => {
    const res = await apiClient.post(BASE_ENDPOINT, payload);
    return res.data as Student;
  },

  // PUT /admin/students/:id
  update: async (id: string, payload: Partial<StudentCreatePayload>): Promise<Student> => {
    const res = await apiClient.put(`${BASE_ENDPOINT}/${id}`, payload);
    return res.data as Student;
  },

  // PUT /admin/students/:id/status
  updateStatus: async (id: string, newStatus: 'active' | 'inactive' | 'at-risk') => {
    // Assuming backend takes { status: "..." } payload
    const res = await apiClient.put(`${BASE_ENDPOINT}/${id}/status`, { status: newStatus });
    return res.data;
  },

  // DELETE /admin/students/:id
  remove: async (id: string) => {
    const res = await apiClient.delete(`${BASE_ENDPOINT}/${id}`);
    return res.data;
  },
};