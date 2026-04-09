import ApiClient from './apiClient';

export interface TeacherLesson {
  _id: string;
  classId: string;
  sectionId: string;
  subjectId: any;
  teacherId: string;
  lessonTitle: string;
  chapterName?: string;
  chapterNumber?: number;
  topicName: string;
  syllabus?: string;
  description?: string;
  duration: number;
  lessonDate: Date;
  learningOutcomes: string[];
  keyPoints: string[];
  teachingMethods: string[];
  resources: Array<{
    resourceName: string;
    resourceUrl: string;
    resourceType: string;
  }>;
  preRequisites: string[];
  assignments: string[];
  materials: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'planned' | 'in-progress' | 'completed';
  notes?: string;
  feedback?: {
    averageRating: number;
    studentFeedback: string;
  };
}

export interface CreateLessonData {
  classId: string;
  sectionId: string;
  subjectId: string;
  lessonTitle: string;
  chapterName?: string;
  chapterNumber?: number;
  topicName: string;
  syllabus?: string;
  description?: string;
  duration?: number;
  lessonDate?: Date;
  learningOutcomes?: string[];
  keyPoints?: string[];
  teachingMethods?: string[];
  resources?: Array<{
    resourceName: string;
    resourceUrl: string;
    resourceType: string;
  }>;
  preRequisites?: string[];
  assignments?: string[];
  materials?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  notes?: string;
}

export interface LessonStats {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  plannedLessons: number;
  totalDuration: number;
  averageDuration: string;
  byDifficulty: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  lessonsWithResources: number;
  lessonsWithAssignments: number;
  averageFeedback: number;
}

class TeacherLessonService {
  private baseUrl = '/api/teacher/lessons';

  /**
   * Create a lesson plan
   */
  async createLesson(data: CreateLessonData): Promise<TeacherLesson> {
    const response = await ApiClient.post(this.baseUrl, data);
    return response.data.data;
  }

  /**
   * Get all lessons for a class
   */
  async getLessonsByClass(
    classId: string,
    filters?: {
      sectionId?: string;
      chapterName?: string;
      status?: string;
    }
  ): Promise<TeacherLesson[]> {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}`, { params: filters });
    return response.data.data;
  }

  /**
   * Get a specific lesson
   */
  async getLessonById(lessonId: string): Promise<TeacherLesson> {
    const response = await ApiClient.get(`${this.baseUrl}/${lessonId}`);
    return response.data.data;
  }

  /**
   * Update a lesson plan
   */
  async updateLesson(lessonId: string, data: Partial<CreateLessonData>): Promise<TeacherLesson> {
    const response = await ApiClient.put(`${this.baseUrl}/${lessonId}`, data);
    return response.data.data;
  }

  /**
   * Delete a lesson
   */
  async deleteLesson(lessonId: string): Promise<void> {
    await ApiClient.delete(`${this.baseUrl}/${lessonId}`);
  }

  /**
   * Mark lesson as in-progress
   */
  async startLesson(lessonId: string): Promise<TeacherLesson> {
    const response = await ApiClient.put(`${this.baseUrl}/${lessonId}/start`);
    return response.data.data;
  }

  /**
   * Mark lesson as completed
   */
  async completeLesson(lessonId: string): Promise<TeacherLesson> {
    const response = await ApiClient.put(`${this.baseUrl}/${lessonId}/complete`);
    return response.data.data;
  }

  /**
   * Add feedback to lesson
   */
  async addLessonFeedback(lessonId: string, rating: number, comment?: string): Promise<TeacherLesson> {
    const response = await ApiClient.put(`${this.baseUrl}/${lessonId}/feedback`, {
      rating,
      comment
    });
    return response.data.data;
  }

  /**
   * Get lessons by chapter
   */
  async getLessonsByChapter(classId: string, chapterName: string) {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}/chapter/${chapterName}`);
    return response.data.data;
  }

  /**
   * Get upcoming lessons
   */
  async getUpcomingLessons(classId: string, days: number = 30): Promise<TeacherLesson[]> {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}/upcoming`, {
      params: { days }
    });
    return response.data.data;
  }

  /**
   * Get lesson statistics for a class
   */
  async getLessonStats(classId: string): Promise<LessonStats> {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}/stats`);
    return response.data.data;
  }

  /**
   * Link assignment to lesson
   */
  async linkAssignmentToLesson(lessonId: string, assignmentId: string): Promise<TeacherLesson> {
    const response = await ApiClient.put(`${this.baseUrl}/${lessonId}/link-assignment/${assignmentId}`);
    return response.data.data;
  }

  /**
   * Link material to lesson
   */
  async linkMaterialToLesson(lessonId: string, materialId: string): Promise<TeacherLesson> {
    const response = await ApiClient.put(`${this.baseUrl}/${lessonId}/link-material/${materialId}`);
    return response.data.data;
  }
}

export default new TeacherLessonService();
