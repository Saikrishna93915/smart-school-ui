import apiClient from "./apiClient";

/**
 * Subject API Service
 * Handles all subject-related API calls
 */

export interface Subject {
  _id: string;
  subjectName: string;
  subjectCode: string;
  className: string;
  description?: string;
  category: "Core" | "Optional" | "Language" | "Activity" | "Lab";
  totalMarks: number;
  passingMarks: number;
  hasPractical: boolean;
  practicalMarks?: number;
  theoryMarks?: number;
  isActive: boolean;
  academicYear: string;
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectCreatePayload {
  subjectName: string;
  subjectCode?: string;
  className: string;
  description?: string;
  category?: "Core" | "Optional" | "Language" | "Activity" | "Lab";
  totalMarks?: number;
  passingMarks?: number;
  hasPractical?: boolean;
  practicalMarks?: number;
  theoryMarks?: number;
  academicYear?: string;
}

export interface BulkSubjectPayload {
  className: string;
  academicYear?: string;
  subjects: SubjectCreatePayload[];
}

export class SubjectService {
  private static BASE_URL = "/subjects";

  /**
   * Get all subjects with optional filters
   */
  static async getAll(params?: {
    className?: string;
    category?: string;
    academicYear?: string;
    isActive?: boolean;
  }): Promise<Subject[]> {
    try {
      const response = await apiClient.get(this.BASE_URL, { params });
      return response.data.data || [];
    } catch (error: any) {
      console.error("Error fetching subjects:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch subjects");
    }
  }

  /**
   * Get subjects by class
   */
  static async getByClass(className: string, academicYear?: string): Promise<Subject[]> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/class/${className}`, {
        params: { academicYear }
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error("Error fetching subjects by class:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch subjects");
    }
  }

  /**
   * Get subject by ID
   */
  static async getById(id: string): Promise<Subject> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching subject:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch subject");
    }
  }

  /**
   * Create a new subject
   */
  static async create(data: SubjectCreatePayload): Promise<Subject> {
    try {
      const response = await apiClient.post(this.BASE_URL, data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error creating subject:", error);
      throw new Error(error.response?.data?.message || "Failed to create subject");
    }
  }

  /**
   * Update a subject
   */
  static async update(id: string, data: Partial<SubjectCreatePayload>): Promise<Subject> {
    try {
      const response = await apiClient.put(`${this.BASE_URL}/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error updating subject:", error);
      throw new Error(error.response?.data?.message || "Failed to update subject");
    }
  }

  /**
   * Delete a subject (soft delete)
   */
  static async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.BASE_URL}/${id}`);
    } catch (error: any) {
      console.error("Error deleting subject:", error);
      throw new Error(error.response?.data?.message || "Failed to delete subject");
    }
  }

  /**
   * Bulk create subjects for a class
   */
  static async bulkCreate(data: BulkSubjectPayload): Promise<{
    created: Subject[];
    errors: any[];
  }> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/bulk`, data);
      return {
        created: response.data.data || [],
        errors: response.data.errors || []
      };
    } catch (error: any) {
      console.error("Error bulk creating subjects:", error);
      throw new Error(error.response?.data?.message || "Failed to bulk create subjects");
    }
  }

  /**
   * Get all classes that have subjects
   */
  static async getClassesWithSubjects(academicYear?: string): Promise<string[]> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/classes/list`, {
        params: { academicYear }
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error("Error fetching classes with subjects:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch classes");
    }
  }
}

export default SubjectService;
