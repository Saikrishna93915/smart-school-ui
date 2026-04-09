import apiClient from "./apiClient";

/**
 * Teacher Assignment API Service
 * Handles teacher-subject-class assignments
 */

export interface TeacherAssignment {
  _id: string;
  teacherId: {
    _id: string;
    personal: {
      firstName: string;
      lastName: string;
    };
    employeeId: string;
    contact?: {
      email: string;
      phone: string;
    };
  };
  className: string;
  section: string;
  subjectId: {
    _id: string;
    subjectName: string;
    subjectCode: string;
    category?: string;
  };
  academicYear: string;
  isActive: boolean;
  assignedBy?: any;
  assignedDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherAssignmentCreatePayload {
  teacherId: string;
  className: string;
  section: string;
  subjectId: string;
  academicYear?: string;
  notes?: string;
}

export interface MyAssignmentGroup {
  className: string;
  section: string;
  academicYear: string;
  subjects: Array<{
    _id: string;
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    category: string;
    academicYear: string;
  }>;
}

export interface BulkAssignmentPayload {
  teacherId: string;
  assignments: Array<{
    className: string;
    section: string;
    subjectId: string;
    academicYear?: string;
  }>;
}

export class TeacherAssignmentService {
  private static BASE_URL = "/teacher-assignments";

  /**
   * Get all teacher assignments (Admin)
   */
  static async getAll(params?: {
    className?: string;
    section?: string;
    teacherId?: string;
    subjectId?: string;
    academicYear?: string;
  }): Promise<TeacherAssignment[]> {
    try {
      const response = await apiClient.get(this.BASE_URL, { params });
      return response.data.data || [];
    } catch (error: any) {
      console.error("Error fetching teacher assignments:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch assignments");
    }
  }

  /**
   * Get my assignments (Teacher dashboard)
   */
  static async getMyAssignments(): Promise<{
    grouped: MyAssignmentGroup[];
    raw: TeacherAssignment[];
  }> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/my`);
      return {
        grouped: response.data.data || [],
        raw: response.data.rawData || []
      };
    } catch (error: any) {
      console.error("Error fetching my assignments:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch assignments");
    }
  }

  /**
   * Get assignments by teacher ID
   */
  static async getByTeacherId(teacherId: string): Promise<TeacherAssignment[]> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/teacher/${teacherId}`);
      return response.data.data || [];
    } catch (error: any) {
      console.error("Error fetching teacher assignments:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch assignments");
    }
  }

  /**
   * Get assignments by class and section (for viewing teachers)
   */
  static async getByClass(
    className: string,
    section: string,
    academicYear?: string
  ): Promise<TeacherAssignment[]> {
    try {
      const response = await apiClient.get(
        `${this.BASE_URL}/class/${className}/section/${section}`,
        { params: { academicYear } }
      );
      return response.data.data || [];
    } catch (error: any) {
      console.error("Error fetching class assignments:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch assignments");
    }
  }

  /**
   * Create a new teacher assignment
   */
  static async create(data: TeacherAssignmentCreatePayload): Promise<TeacherAssignment> {
    try {
      const response = await apiClient.post(this.BASE_URL, data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error creating teacher assignment:", error);
      throw new Error(error.response?.data?.message || "Failed to create assignment");
    }
  }

  /**
   * Update a teacher assignment
   */
  static async update(
    id: string,
    data: Partial<TeacherAssignmentCreatePayload> & { isActive?: boolean }
  ): Promise<TeacherAssignment> {
    try {
      const response = await apiClient.put(`${this.BASE_URL}/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error updating teacher assignment:", error);
      throw new Error(error.response?.data?.message || "Failed to update assignment");
    }
  }

  /**
   * Delete a teacher assignment
   */
  static async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.BASE_URL}/${id}`);
    } catch (error: any) {
      console.error("Error deleting teacher assignment:", error);
      throw new Error(error.response?.data?.message || "Failed to delete assignment");
    }
  }

  /**
   * Bulk assign subjects to a teacher
   */
  static async bulkAssign(data: BulkAssignmentPayload): Promise<{
    created: TeacherAssignment[];
    errors: any[];
  }> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/bulk`, data);
      return {
        created: response.data.data || [],
        errors: response.data.errors || []
      };
    } catch (error: any) {
      console.error("Error bulk assigning:", error);
      throw new Error(error.response?.data?.message || "Failed to bulk assign");
    }
  }
}

export default TeacherAssignmentService;
