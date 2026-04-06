import apiClient from "@/Services/apiClient";
import { Student, StudentCreatePayload } from "../types/student";

const BASE_ENDPOINT = "/admin/students";

export const StudentsService = {
  // GET /admin/students
  async getAll(): Promise<Student[]> {
    const res = await apiClient.get(BASE_ENDPOINT);
    const payload = res.data as any;

    // Support array and common API wrapper shapes.
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.students)) return payload.students;
    if (Array.isArray(payload?.result)) return payload.result;

    return [];
  },

  // GET /admin/students/:id
  async getById(id: string): Promise<Student> {
    const res = await apiClient.get(`${BASE_ENDPOINT}/${id}`);
    return res.data;
  },

  // POST /admin/students
  async create(payload: StudentCreatePayload): Promise<Student> {
    const res = await apiClient.post(BASE_ENDPOINT, payload);
    // Backend returns { success: true, message: "...", student: {...} }
    return res.data.student || res.data;
  },

  // PUT /admin/students/:id
  async update(
    id: string,
    payload: Partial<StudentCreatePayload>
  ): Promise<Student> {
    const res = await apiClient.put(`${BASE_ENDPOINT}/${id}`, payload);
    return res.data;
  },

  // PUT /admin/students/:id/status
  async updateStatus(
    id: string,
    newStatus: "active" | "inactive" | "at-risk"
  ) {
    const res = await apiClient.put(`${BASE_ENDPOINT}/${id}/status`, {
      status: newStatus,
    });
    return res.data;
  },

  // DELETE /admin/students/:id
  async remove(id: string) {
    const res = await apiClient.delete(`${BASE_ENDPOINT}/${id}`);
    return res.data;
  },
};
