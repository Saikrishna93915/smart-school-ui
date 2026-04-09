import ApiClient from './apiClient';

export interface ClassSchedule {
  _id: string;
  classId: string;
  sectionId: string;
  teacherId: string;
  subjectId: any;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  dayName: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string;
  endTime: string;
  duration: number;
  room?: string;
  building?: string;
  academicYear: number;
  semester: string;
  isActive: boolean;
  notes?: string;
}

export interface CreateScheduleData {
  classId: string;
  sectionId: string;
  subjectId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  room?: string;
  building?: string;
  academicYear?: number;
  semester?: string;
  notes?: string;
}

export interface WeeklySchedule {
  Sunday: ClassSchedule[];
  Monday: ClassSchedule[];
  Tuesday: ClassSchedule[];
  Wednesday: ClassSchedule[];
  Thursday: ClassSchedule[];
  Friday: ClassSchedule[];
  Saturday: ClassSchedule[];
}

export interface ScheduleSummary {
  totalSessions: number;
  totalHours: string;
  sessionsPerWeek: number;
  averageSessionDuration: string;
  rooms: string[];
  buildings: string[];
  daysOfWeek: string[];
}

class ClassScheduleService {
  private baseUrl = '/api/teacher/schedule';

  /**
   * Create a class schedule entry
   */
  async createSchedule(data: CreateScheduleData): Promise<ClassSchedule> {
    const response = await ApiClient.post(this.baseUrl, data);
    return response.data.data;
  }

  /**
   * Get all schedules for a class
   */
  async getSchedulesByClass(
    classId: string,
    filters?: {
      sectionId?: string;
      academicYear?: number;
      semester?: string;
    }
  ) {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}`, { params: filters });
    return response.data;
  }

  /**
   * Get today's schedule for the teacher
   */
  async getTodaySchedule(): Promise<ClassSchedule[]> {
    const response = await ApiClient.get(`${this.baseUrl}/today`);
    return response.data.data;
  }

  /**
   * Get weekly schedule for the teacher
   */
  async getWeeklySchedule(): Promise<WeeklySchedule> {
    const response = await ApiClient.get(`${this.baseUrl}/weekly`);
    return response.data.data;
  }

  /**
   * Get a specific schedule entry
   */
  async getScheduleById(scheduleId: string): Promise<ClassSchedule> {
    const response = await ApiClient.get(`${this.baseUrl}/${scheduleId}`);
    return response.data.data;
  }

  /**
   * Update a schedule entry
   */
  async updateSchedule(scheduleId: string, data: Partial<CreateScheduleData>): Promise<ClassSchedule> {
    const response = await ApiClient.put(`${this.baseUrl}/${scheduleId}`, data);
    return response.data.data;
  }

  /**
   * Delete a schedule entry
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    await ApiClient.delete(`${this.baseUrl}/${scheduleId}`);
  }

  /**
   * Check for schedule conflicts
   */
  async checkScheduleConflicts(
    classId: string,
    sectionId: string,
    params: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }
  ) {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}/${sectionId}/conflicts`, {
      params
    });
    return response.data;
  }

  /**
   * Get schedule summary for a class
   */
  async getScheduleSummary(classId: string): Promise<ScheduleSummary> {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}/summary`);
    return response.data.data;
  }
}

export default new ClassScheduleService();
