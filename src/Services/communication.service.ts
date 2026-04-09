import ApiClient from './apiClient';

export interface ClassAnnouncement {
  _id: string;
  classId: string;
  sectionId: string;
  teacherId: string;
  title: string;
  description: string;
  content: string;
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: Date;
  }>;
  type: 'general' | 'academic' | 'event' | 'exam' | 'assignment' | 'emergency';
  priority: 'normal' | 'high' | 'urgent';
  visibility: 'students' | 'parents' | 'both' | 'all';
  datePosted: Date;
  expiryDate?: Date;
  isActive: boolean;
  isScheduled: boolean;
  schedulePublish?: Date;
  views: number;
  likes: number;
  viewedBy: Array<{
    userId: string;
    viewedAt: Date;
  }>;
  comments: Array<{
    userId: string;
    comment: string;
    commentedAt: Date;
  }>;
  notificationsSent: boolean;
  sentTo: Array<{
    userId: string;
    sentAt: Date;
  }>;
}

export interface AnnouncementStats {
  total: number;
  active: number;
  archived: number;
  scheduled: number;
  byType: {
    general: number;
    academic: number;
    event: number;
    exam: number;
    assignment: number;
    emergency: number;
  };
  byPriority: {
    normal: number;
    high: number;
    urgent: number;
  };
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  mostViewedAnnouncements: Array<{
    _id: string;
    title: string;
    views: number;
    likes: number;
  }>;
}

export interface CreateAnnouncementData {
  classId: string;
  sectionId: string;
  title: string;
  description: string;
  content?: string;
  type?: 'general' | 'academic' | 'event' | 'exam' | 'assignment' | 'emergency';
  priority?: 'normal' | 'high' | 'urgent';
  visibility?: 'students' | 'parents' | 'both' | 'all';
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
  }>;
  schedulePublish?: Date;
  expiryDate?: Date;
}

class CommunicationService {
  private baseUrl = '/api/teacher/announcements';

  /**
   * Create an announcement
   */
  async createAnnouncement(data: CreateAnnouncementData): Promise<ClassAnnouncement> {
    const response = await ApiClient.post(this.baseUrl, data);
    return response.data.data;
  }

  /**
   * Get all announcements for a class
   */
  async getAnnouncementsByClass(
    classId: string,
    filters?: {
      type?: string;
      priority?: string;
      includeScheduled?: boolean;
    }
  ): Promise<ClassAnnouncement[]> {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}`, { params: filters });
    return response.data.data;
  }

  /**
   * Get a specific announcement (increments views)
   */
  async getAnnouncementById(classId: string, announcementId: string): Promise<ClassAnnouncement> {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}/${announcementId}`);
    return response.data.data;
  }

  /**
   * Update an announcement
   */
  async updateAnnouncement(
    announcementId: string,
    data: Partial<CreateAnnouncementData>
  ): Promise<ClassAnnouncement> {
    const response = await ApiClient.put(`${this.baseUrl}/${announcementId}`, data);
    return response.data.data;
  }

  /**
   * Delete an announcement
   */
  async deleteAnnouncement(announcementId: string): Promise<void> {
    await ApiClient.delete(`${this.baseUrl}/${announcementId}`);
  }

  /**
   * Publish a scheduled announcement
   */
  async publishAnnouncement(announcementId: string): Promise<ClassAnnouncement> {
    const response = await ApiClient.put(`${this.baseUrl}/${announcementId}/publish`);
    return response.data.data;
  }

  /**
   * Archive an announcement
   */
  async archiveAnnouncement(announcementId: string): Promise<ClassAnnouncement> {
    const response = await ApiClient.put(`${this.baseUrl}/${announcementId}/archive`);
    return response.data.data;
  }

  /**
   * Add comment to announcement
   */
  async addComment(announcementId: string, comment: string): Promise<ClassAnnouncement> {
    const response = await ApiClient.put(`${this.baseUrl}/${announcementId}/comment`, { comment });
    return response.data.data;
  }

  /**
   * Like/Unlike an announcement
   */
  async toggleLike(announcementId: string): Promise<ClassAnnouncement> {
    const response = await ApiClient.put(`${this.baseUrl}/${announcementId}/like`);
    return response.data.data;
  }

  /**
   * Get announcements statistics
   */
  async getAnnouncementStats(classId: string): Promise<AnnouncementStats> {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}/stats`);
    return response.data.data;
  }

  /**
   * Get engagement report for an announcement
   */
  async getAnnouncementEngagement(announcementId: string) {
    const response = await ApiClient.get(`${this.baseUrl}/${announcementId}/engagement`);
    return response.data.data;
  }
}

export default new CommunicationService();
