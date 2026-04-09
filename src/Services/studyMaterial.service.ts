import ApiClient from './apiClient';

export interface StudyMaterial {
  _id: string;
  classId: string;
  sectionId: string;
  subjectId: any;
  teacherId: string;
  title: string;
  description?: string;
  chapterName?: string;
  topicName?: string;
  materialType: 'pdf' | 'video' | 'document' | 'worksheet' | 'presentation' | 'image' | 'audio' | 'other';
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  thumbnailUrl?: string;
  duration?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags: string[];
  learningOutcomes: string[];
  downloads: number;
  views: number;
  rating?: {
    average: number;
    count: number;
  };
  status: 'draft' | 'published' | 'archived';
  uploadedDate: Date;
}

export interface MaterialsSummary {
  total: number;
  byType: {
    pdf: number;
    video: number;
    document: number;
    worksheet: number;
    presentation: number;
    image: number;
    audio: number;
  };
  byDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  totalDownloads: number;
  totalViews: number;
  topMaterials: Array<{
    _id: string;
    title: string;
    downloads: number;
    views: number;
  }>;
}

export interface UploadMaterialData {
  classId: string;
  sectionId: string;
  subjectId: string;
  title: string;
  description?: string;
  chapterName?: string;
  topicName?: string;
  materialType: 'pdf' | 'video' | 'document' | 'worksheet' | 'presentation' | 'image' | 'audio' | 'other';
  fileUrl: string;
  fileName: string;
  thumbnailUrl?: string;
  duration?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  learningOutcomes?: string[];
}

class StudyMaterialService {
  private baseUrl = '/api/teacher/materials';

  /**
   * Upload a study material
   */
  async uploadMaterial(data: UploadMaterialData): Promise<StudyMaterial> {
    const response = await ApiClient.post(this.baseUrl, data);
    return response.data.data;
  }

  /**
   * Get all materials for a class
   */
  async getMaterialsByClass(
    classId: string,
    filters?: { materialType?: string; subjectId?: string }
  ): Promise<StudyMaterial[]> {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}`, { params: filters });
    return response.data.data;
  }

  /**
   * Get a specific material (increments view count)
   */
  async getMaterialById(materialId: string): Promise<StudyMaterial> {
    const response = await ApiClient.get(`${this.baseUrl}/${materialId}/view`);
    return response.data.data;
  }

  /**
   * Update a study material
   */
  async updateMaterial(materialId: string, data: Partial<UploadMaterialData>): Promise<StudyMaterial> {
    const response = await ApiClient.put(`${this.baseUrl}/${materialId}`, data);
    return response.data.data;
  }

  /**
   * Delete a study material
   */
  async deleteMaterial(materialId: string): Promise<void> {
    await ApiClient.delete(`${this.baseUrl}/${materialId}`);
  }

  /**
   * Get materials grouped by type with statistics
   */
  async getMaterialsByType(classId: string, materialType: string) {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}/type/${materialType}`);
    return response.data.data;
  }

  /**
   * Track material download
   */
  async trackDownload(materialId: string): Promise<StudyMaterial> {
    const response = await ApiClient.put(`${this.baseUrl}/${materialId}/download`);
    return response.data.data;
  }

  /**
   * Get materials library summary with statistics
   */
  async getMaterialsSummary(classId: string): Promise<MaterialsSummary> {
    const response = await ApiClient.get(`${this.baseUrl}/${classId}/summary`);
    return response.data.data;
  }
}

export default new StudyMaterialService();
