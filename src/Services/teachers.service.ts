// src/Services/teachers.service.ts
import apiClient from "@/Services/apiClient";
import { Teacher, TeacherCreatePayload, TeacherUpdateDetailsPayload, AssignedClass } from "../types/teacher";

const BASE_ENDPOINT = "/admin/teachers";

// Define the API response structure based on what we see in MongoDB
interface ApiSuccessResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Sometimes API returns the data directly without success wrapper
type ApiResponse<T> = ApiSuccessResponse<T> | T;

interface TeacherUpdateStatusPayload {
  status: "active" | "inactive";
}

interface TeacherUpdateClassesPayload {
  assignedClasses: AssignedClass[];
}

interface TeachersFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  status?: "active" | "inactive";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Helper function to check if response has success structure
function isApiSuccessResponse<T>(response: any): response is ApiSuccessResponse<T> {
  return response && typeof response === 'object' && 'success' in response;
}

// Helper function to check if object is a Teacher
function isTeacher(obj: any): obj is Teacher {
  return obj && 
         typeof obj === 'object' && 
         '_id' in obj && 
         'personal' in obj && 
         'contact' in obj;
}

// Helper function to extract data from response
function extractDataFromResponse<T>(response: any): T | null {
  if (!response) return null;
  
  // If response is already the data type we want
  if (isTeacher(response)) {
    return response as T;
  }
  
  // If response has success wrapper
  if (isApiSuccessResponse(response)) {
    if (response.data && isTeacher(response.data)) {
      return response.data as T;
    }
    // Sometimes data might be in the response object itself
    if (isTeacher(response)) {
      return response as T;
    }
  }
  
  // Try to find teacher data in the response
  for (const key in response) {
    if (isTeacher(response[key])) {
      return response[key] as T;
    }
  }
  
  return null;
}

// Helper function to check if item is Teacher
function isTeacherArray(arr: any[]): arr is Teacher[] {
  return Array.isArray(arr) && (arr.length === 0 || arr.every(isTeacher));
}

// Helper function to extract array from response
function extractArrayFromResponse<T>(response: any): T[] {
  if (!response) return [];
  
  // If response is already an array
  if (Array.isArray(response)) {
    if (isTeacherArray(response)) {
      return response as T[];
    }
    return response as T[];
  }
  
  // If response has success wrapper with data array
  if (isApiSuccessResponse(response)) {
    if (Array.isArray(response.data)) {
      if (isTeacherArray(response.data)) {
        return response.data as T[];
      }
      return response.data as T[];
    }
  }
  
  // Try to find array in the response
  for (const key in response) {
    if (Array.isArray(response[key])) {
      if (isTeacherArray(response[key])) {
        return response[key] as T[];
      }
      return response[key] as T[];
    }
  }
  
  return [];
}

export const TeachersService = {
  /**
   * Create a new teacher
   */
  async create(payload: TeacherCreatePayload): Promise<Teacher> {
    try {
      const response = await apiClient.post(BASE_ENDPOINT, payload);
      const responseData = response.data;
      
      console.log("Create teacher response:", responseData); // Debug
      
      // Try to extract teacher data from response
      const teacherData = extractDataFromResponse<Teacher>(responseData);
      
      if (teacherData) {
        return teacherData;
      }
      
      // If we couldn't extract, check if teacher was created anyway
      // Sometimes API returns 400 but still creates the data
      if (response.status === 400 || response.status === 200) {
        const allTeachers = await this.getAll();
        const existingTeacher = allTeachers.find(t => 
          t.contact?.email === payload.email
        );
        
        if (existingTeacher) {
          console.warn("Teacher was created despite non-ideal response");
          return existingTeacher;
        }
      }
      
      throw new Error("Invalid response structure from server");
      
    } catch (error: any) {
      console.error("Error creating teacher:", error);
      
      // Check if teacher was created anyway
      if (error.response?.status === 400) {
        try {
          const allTeachers = await this.getAll();
          const existingTeacher = allTeachers.find(t => 
            t.contact?.email === payload.email
          );
          
          if (existingTeacher) {
            console.warn("Teacher was created despite 400 error");
            return existingTeacher;
          }
        } catch (fetchError) {
          // Ignore fetch error
        }
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        "Failed to create teacher"
      );
    }
  },

  /**
   * Get all teachers
   */
  async getAll(params?: TeachersFilterParams): Promise<Teacher[]> {
    try {
      const response = await apiClient.get(BASE_ENDPOINT, { params });
      const responseData = response.data;
      
      console.log("Get all teachers response structure:", responseData); // Debug
      
      // Extract teachers array from response
      const teachers = extractArrayFromResponse<Teacher>(responseData);
      
      console.log("Extracted teachers:", teachers.length, teachers.slice(0, 2)); // Debug
      return teachers;
      
    } catch (error: any) {
      console.error("Error fetching teachers:", error);
      
      // Fallback: try direct fetch
      try {
        console.log("Trying fallback fetch...");
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
        const directResponse = await fetch(`${apiBaseUrl}/admin/teachers`, {
          headers,
        });
        
        if (directResponse.ok) {
          const data = await directResponse.json();
          console.log("Fallback fetch data:", data);
          
          return extractArrayFromResponse<Teacher>(data);
        }
      } catch (fallbackError) {
        console.error("Fallback fetch failed:", fallbackError);
      }
      
      return [];
    }
  },

  /**
   * Get teacher by ID
   */
  async getById(id: string): Promise<Teacher> {
    try {
      const response = await apiClient.get(`${BASE_ENDPOINT}/${id}`);
      const responseData = response.data;
      
      // Extract teacher data from response
      const teacherData = extractDataFromResponse<Teacher>(responseData);
      
      if (teacherData) {
        return teacherData;
      }
      
      throw new Error("Teacher not found or invalid response");
      
    } catch (error: any) {
      console.error(`Error fetching teacher ${id}:`, error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        "Failed to fetch teacher"
      );
    }
  },

  /**
   * Update teacher details
   */
  async update(id: string, payload: TeacherUpdateDetailsPayload): Promise<Teacher> {
    try {
      const response = await apiClient.put(`${BASE_ENDPOINT}/${id}`, payload);
      const responseData = response.data;
      
      // Extract teacher data from response
      const teacherData = extractDataFromResponse<Teacher>(responseData);
      
      if (teacherData) {
        return teacherData;
      }
      
      // If update was successful but we don't have data, fetch it
      if (response.status === 200 || response.status === 204) {
        return await this.getById(id);
      }
      
      throw new Error("Invalid response from server");
      
    } catch (error: any) {
      console.error(`Error updating teacher ${id}:`, error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        "Failed to update teacher"
      );
    }
  },

  /**
   * Update teacher status
   */
  async updateStatus(id: string, newStatus: "active" | "inactive"): Promise<Teacher> {
    try {
      const payload = { status: newStatus };
      const response = await apiClient.patch(`${BASE_ENDPOINT}/${id}/status`, payload);
      const responseData = response.data;
      
      // Extract teacher data from response
      const teacherData = extractDataFromResponse<Teacher>(responseData);
      
      if (teacherData) {
        return teacherData;
      }
      
      // Fallback: fetch updated teacher
      return await this.getById(id);
      
    } catch (error: any) {
      console.error(`Error updating teacher status ${id}:`, error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        "Failed to update teacher status"
      );
    }
  },

  /**
   * Assign classes to teacher
   */
  async assignClasses(id: string, classes: AssignedClass[]): Promise<Teacher> {
    try {
      const payload = { assignedClasses: classes };
      const response = await apiClient.post(`${BASE_ENDPOINT}/${id}/assign-classes`, payload);
      const responseData = response.data;
      
      // Extract teacher data from response
      const teacherData = extractDataFromResponse<Teacher>(responseData);
      
      if (teacherData) {
        return teacherData;
      }
      
      // Fallback: fetch updated teacher
      return await this.getById(id);
      
    } catch (error: any) {
      console.error(`Error assigning classes to teacher ${id}:`, error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        "Failed to assign classes"
      );
    }
  },

  /**
   * Delete a teacher
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`${BASE_ENDPOINT}/${id}`);
      const responseData = response.data;
      
      // Check for success response
      if (isApiSuccessResponse(responseData) && responseData.success) {
        return {
          success: true,
          message: responseData.message || "Teacher deleted successfully"
        };
      }
      
      // If response doesn't have success structure but status is ok
      if (response.status === 200 || response.status === 204) {
        return {
          success: true,
          message: "Teacher deleted successfully"
        };
      }
      
      return {
        success: true,
        message: "Teacher deleted successfully"
      };
      
    } catch (error: any) {
      console.error(`Error deleting teacher ${id}:`, error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        "Failed to delete teacher"
      );
    }
  },

  /**
   * Search teachers
   */
  async search(query: string): Promise<Teacher[]> {
    try {
      const response = await apiClient.get(`${BASE_ENDPOINT}/search`, {
        params: { q: query },
      });
      
      return extractArrayFromResponse<Teacher>(response.data);
      
    } catch (error: any) {
      console.error("Error searching teachers:", error);
      return [];
    }
  },

  /**
   * Get departments
   */
  async getDepartments(): Promise<string[]> {
    try {
      const response = await apiClient.get(`${BASE_ENDPOINT}/departments`);
      
      // Try to extract departments array
      const departments = extractArrayFromResponse<string>(response.data);
      
      if (departments.length > 0) {
        return departments;
      }
      
      // Fallback: extract from teachers
      const teachers = await this.getAll();
      const deptSet = new Set<string>();
      
      teachers.forEach(teacher => {
        if (teacher.professional?.department) {
          deptSet.add(teacher.professional.department);
        }
      });
      
      return Array.from(deptSet).sort();
      
    } catch (error: any) {
      console.error("Error fetching departments:", error);
      
      // Fallback
      const teachers = await this.getAll();
      const deptSet = new Set<string>();
      
      teachers.forEach(teacher => {
        if (teacher.professional?.department) {
          deptSet.add(teacher.professional.department);
        }
      });
      
      return Array.from(deptSet).sort();
    }
  },

  /**
   * Get teacher statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    averageExperience: number;
    departments: Record<string, number>;
  }> {
    try {
      const response = await apiClient.get(`${BASE_ENDPOINT}/stats`);
      
      // Try to extract stats from response
      const statsData = response.data;
      
      if (statsData && 
          typeof statsData === 'object' && 
          'total' in statsData && 
          'active' in statsData && 
          'inactive' in statsData) {
        return statsData as {
          total: number;
          active: number;
          inactive: number;
          averageExperience: number;
          departments: Record<string, number>;
        };
      }
      
      // Fallback: calculate from teachers
      return await this.calculateStatsFromTeachers();
      
    } catch (error: any) {
      console.error("Error fetching teacher stats:", error);
      return await this.calculateStatsFromTeachers();
    }
  },

  /**
   * Helper: Calculate stats from teachers list
   */
  async calculateStatsFromTeachers(): Promise<{
    total: number;
    active: number;
    inactive: number;
    averageExperience: number;
    departments: Record<string, number>;
  }> {
    try {
      const teachers = await this.getAll();
      
      const active = teachers.filter(t => t.status === 'active').length;
      const inactive = teachers.filter(t => t.status === 'inactive').length;
      
      const departments: Record<string, number> = {};
      let totalExperience = 0;
      let teachersWithExperience = 0;
      
      teachers.forEach(teacher => {
        const dept = teacher.professional?.department || 'Unknown';
        departments[dept] = (departments[dept] || 0) + 1;
        
        if (teacher.professional?.experienceYears !== undefined) {
          totalExperience += teacher.professional.experienceYears;
          teachersWithExperience++;
        }
      });
      
      const averageExperience = teachersWithExperience > 0 
        ? totalExperience / teachersWithExperience 
        : 0;
      
      return {
        total: teachers.length,
        active,
        inactive,
        averageExperience,
        departments
      };
      
    } catch (error) {
      console.error("Error calculating stats:", error);
      return { 
        total: 0, 
        active: 0, 
        inactive: 0, 
        averageExperience: 0, 
        departments: {} 
      };
    }
  }
};