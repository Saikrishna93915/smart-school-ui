import apiClient from './apiClient';

export interface GradeEntry {
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  gradePoint: number;
  remark: string;
  color?: string;
  _id?: string;
}

export interface GradeScale {
  _id?: string;
  name: string;
  description?: string;
  grades: GradeEntry[];
  isDefault?: boolean;
  createdBy?: { name: string; email: string };
  createdAt?: string;
}

export class GradeScaleService {
  private static BASE_URL = '/grade-scales';

  static async getAll() {
    const response = await apiClient.get(this.BASE_URL);
    return response.data?.data || response.data || [];
  }

  static async getById(id: string) {
    const response = await apiClient.get(`${this.BASE_URL}/${id}`);
    return response.data?.data;
  }

  static async create(data: { name: string; description?: string; grades: GradeEntry[]; isDefault?: boolean }) {
    const response = await apiClient.post(this.BASE_URL, data);
    return response.data?.data;
  }

  static async update(id: string, data: { name?: string; description?: string; grades?: GradeEntry[]; isDefault?: boolean }) {
    const response = await apiClient.put(`${this.BASE_URL}/${id}`, data);
    return response.data?.data;
  }

  static async remove(id: string) {
    const response = await apiClient.delete(`${this.BASE_URL}/${id}`);
    return response.data;
  }
}

export default GradeScaleService;
