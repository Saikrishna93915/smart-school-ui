import apiClient from "./apiClient";

/**
 * Syllabus API Service
 * Handles syllabus and chapter management
 */

export interface Chapter {
  _id?: string;
  chapterNumber: number;
  chapterName: string;
  description?: string;
  topics?: Array<{
    topicName: string;
    duration?: string;
  }>;
  status: "pending" | "ongoing" | "completed";
  startDate?: string;
  endDate?: string;
  completedDate?: string;
  learningOutcomes?: string[];
  resources?: Array<{
    title: string;
    url: string;
    type: "pdf" | "video" | "link" | "document";
  }>;
  teacherNotes?: string;
  updatedBy?: any;
  updatedAt?: string;
}

export interface Syllabus {
  _id: string;
  className: string;
  section: string;
  subjectId: {
    _id: string;
    subjectName: string;
    subjectCode: string;
    category?: string;
    totalMarks?: number;
  };
  academicYear: string;
  chapters: Chapter[];
  totalChapters: number;
  completedChapters: number;
  progressPercentage: number;
  createdBy?: any;
  updatedBy?: any;
  isPublished: boolean;
  term?: "Term 1" | "Term 2" | "Term 3" | "Annual";
  examSchedule?: {
    midTerm?: string;
    finalTerm?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface SyllabusCreatePayload {
  className: string;
  section: string;
  subjectId: string;
  academicYear?: string;
  chapters?: Chapter[];
  term?: "Term 1" | "Term 2" | "Term 3" | "Annual";
  examSchedule?: {
    midTerm?: string;
    finalTerm?: string;
  };
}

export interface ChapterUpdatePayload {
  status?: "pending" | "ongoing" | "completed";
  startDate?: string;
  endDate?: string;
  teacherNotes?: string;
}

export interface StudentSyllabusResponse {
  studentInfo: {
    name: string;
    class: string;
    section: string;
    academicYear: string;
  };
  data: Syllabus[];
}

export interface SyllabusStats {
  className: string;
  section: string;
  overallProgress: number;
  subjects: Array<{
    subjectName: string;
    totalChapters: number;
    completedChapters: number;
    progressPercentage: number;
    ongoingChapters: number;
    pendingChapters: number;
  }>;
}

export class SyllabusService {
  private static BASE_URL = "/syllabus";

  /**
   * Get all syllabus with filters (role-based)
   */
  static async getAll(params?: {
    className?: string;
    section?: string;
    subjectId?: string;
    academicYear?: string;
  }): Promise<Syllabus[]> {
    try {
      const response = await apiClient.get(this.BASE_URL, { params });
      return response.data.data || [];
    } catch (error: any) {
      console.error("Error fetching syllabus:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch syllabus");
    }
  }

  /**
   * Get syllabus by ID
   */
  static async getById(id: string): Promise<Syllabus> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching syllabus:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch syllabus");
    }
  }

  /**
   * Get student's syllabus (auto-detects class)
   */
  static async getStudentSyllabus(): Promise<StudentSyllabusResponse> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/student/my`);
      return {
        studentInfo: response.data.studentInfo,
        data: response.data.data || []
      };
    } catch (error: any) {
      console.error("Error fetching student syllabus:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch syllabus");
    }
  }

  /**
   * Create new syllabus
   */
  static async create(data: SyllabusCreatePayload): Promise<Syllabus> {
    try {
      const response = await apiClient.post(this.BASE_URL, data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error creating syllabus:", error);
      throw new Error(error.response?.data?.message || "Failed to create syllabus");
    }
  }

  /**
   * Update syllabus
   */
  static async update(
    id: string,
    data: Partial<SyllabusCreatePayload>
  ): Promise<Syllabus> {
    try {
      const response = await apiClient.put(`${this.BASE_URL}/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error updating syllabus:", error);
      throw new Error(error.response?.data?.message || "Failed to update syllabus");
    }
  }

  /**
   * Delete syllabus
   */
  static async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.BASE_URL}/${id}`);
    } catch (error: any) {
      console.error("Error deleting syllabus:", error);
      throw new Error(error.response?.data?.message || "Failed to delete syllabus");
    }
  }

  /**
   * Add a new chapter
   */
  static async addChapter(syllabusId: string, chapter: Chapter): Promise<Syllabus> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/${syllabusId}/chapter`, chapter);
      return response.data.data;
    } catch (error: any) {
      console.error("Error adding chapter:", error);
      throw new Error(error.response?.data?.message || "Failed to add chapter");
    }
  }

  /**
   * Update chapter status
   */
  static async updateChapterStatus(
    syllabusId: string,
    chapterId: string,
    data: ChapterUpdatePayload
  ): Promise<Syllabus> {
    try {
      const response = await apiClient.put(
        `${this.BASE_URL}/${syllabusId}/chapter/${chapterId}`,
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error updating chapter status:", error);
      throw new Error(error.response?.data?.message || "Failed to update chapter");
    }
  }

  /**
   * Delete a chapter
   */
  static async deleteChapter(syllabusId: string, chapterId: string): Promise<Syllabus> {
    try {
      const response = await apiClient.delete(
        `${this.BASE_URL}/${syllabusId}/chapter/${chapterId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error deleting chapter:", error);
      throw new Error(error.response?.data?.message || "Failed to delete chapter");
    }
  }

  /**
   * Get syllabus statistics for a class
   */
  static async getStats(
    className: string,
    section: string,
    academicYear?: string
  ): Promise<SyllabusStats> {
    try {
      const response = await apiClient.get(
        `${this.BASE_URL}/stats/${className}/${section}`,
        { params: { academicYear } }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching syllabus stats:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch statistics");
    }
  }
}

export default SyllabusService;
