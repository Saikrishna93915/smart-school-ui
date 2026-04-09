import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface Certificate {
  _id: string;
  certificateId: string;
  studentId: string | {
    _id: string;
    name: string;
    admissionNumber: string;
    rollNumber: string;
    class: string;
    section?: string;
  };
  studentName: string;
  rollNumber?: string;
  admissionNumber?: string;
  certificateType: string;
  class: string;
  section?: string;
  academicYear: string;
  purpose: string;
  certificateText?: string;
  additionalNotes?: string;
  issueDate: string;
  validUntil?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Issued' | 'Cancelled';
  requestedBy?: string | { _id: string; name: string; role: string };
  approvedBy?: string | { _id: string; name: string; role: string };
  approvedAt?: string;
  rejectionReason?: string;
  qrCode?: string;
  verificationUrl?: string;
  digitalSignature?: string;
  pdfUrl?: string;
  pdfPath?: string;
  percentage?: number;
  attendance?: number;
  grade?: string;
  isVerified: boolean;
  verificationCount: number;
  lastVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateTemplate {
  type: string;
  description: string;
  icon: string;
  template: string;
}

export interface CertificateStats {
  totalIssued: number;
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  verificationRate: number;
  certificateTypes: number;
  byType: Array<{ _id: string; count: number }>;
  recentCertificates: Certificate[];
}

export interface CreateCertificateRequest {
  studentId: string;
  certificateType: string;
  class: string;
  section?: string;
  academicYear: string;
  purpose: string;
  issueDate?: string;
  validUntil?: string;
  additionalNotes?: string;
  percentage?: number;
  attendance?: number;
}

export interface BulkCertificateRequest {
  studentIds: string[];
  certificateType: string;
  academicYear: string;
  purpose: string;
}

class CertificateService {
  /**
   * Create a new certificate
   */
  async createCertificate(data: CreateCertificateRequest): Promise<Certificate> {
    const response = await axiosInstance.post('/certificates', data);
    return response.data.data;
  }

  /**
   * Get all certificates with optional filters
   */
  async getCertificates(params?: {
    status?: string;
    certificateType?: string;
    studentId?: string;
    academicYear?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    certificates: Certificate[];
    pagination: {
      total: number;
      page: number;
      pages: number;
      limit: number;
    };
  }> {
    const response = await axiosInstance.get('/certificates', { params });
    return {
      certificates: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Get certificate by ID
   */
  async getCertificateById(id: string): Promise<Certificate> {
    const response = await axiosInstance.get(`/certificates/${id}`);
    return response.data.data;
  }

  /**
   * Verify certificate by certificate ID
   */
  async verifyCertificate(certificateId: string): Promise<{
    verified: boolean;
    data?: {
      certificateId: string;
      studentName: string;
      certificateType: string;
      class: string;
      academicYear: string;
      issueDate: string;
      validUntil?: string;
      status: string;
      isVerified: boolean;
      approvedBy?: string;
      verificationCount: number;
    };
  }> {
    const response = await axiosInstance.get(`/certificates/verify/${certificateId}`);
    return response.data;
  }

  /**
   * Approve certificate
   */
  async approveCertificate(id: string): Promise<Certificate> {
    const response = await axiosInstance.put(`/certificates/${id}/approve`);
    return response.data.data;
  }

  /**
   * Reject certificate
   */
  async rejectCertificate(id: string, reason: string): Promise<Certificate> {
    const response = await axiosInstance.put(`/certificates/${id}/reject`, { reason });
    return response.data.data;
  }

  /**
   * Update certificate
   */
  async updateCertificate(id: string, data: Partial<CreateCertificateRequest>): Promise<Certificate> {
    const response = await axiosInstance.put(`/certificates/${id}`, data);
    return response.data.data;
  }

  /**
   * Delete certificate
   */
  async deleteCertificate(id: string): Promise<void> {
    await axiosInstance.delete(`/certificates/${id}`);
  }

  /**
   * Cancel certificate
   */
  async cancelCertificate(id: string, reason: string): Promise<Certificate> {
    const response = await axiosInstance.put(`/certificates/${id}/cancel`, { reason });
    return response.data.data;
  }

  /**
   * Get certificate statistics
   */
  async getCertificateStats(academicYear?: string): Promise<CertificateStats> {
    const response = await axiosInstance.get('/certificates/stats', {
      params: academicYear ? { academicYear } : undefined,
    });
    return response.data.data;
  }

  /**
   * Get certificate templates
   */
  async getTemplates(): Promise<CertificateTemplate[]> {
    const response = await axiosInstance.get('/certificates/templates');
    return response.data.data;
  }

  /**
   * Bulk issue certificates
   */
  async bulkIssueCertificates(data: BulkCertificateRequest): Promise<{
    certificates: Certificate[];
    errors: Array<{ studentId: string; studentName: string; error: string }>;
    total: number;
    successful: number;
    failed: number;
  }> {
    const response = await axiosInstance.post('/certificates/bulk', data);
    return response.data.data;
  }

  /**
   * Download certificate as PDF (placeholder - will be implemented server-side)
   */
  async downloadCertificatePDF(id: string): Promise<Blob> {
    const response = await axiosInstance.get(`/certificates/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Get certificate history for a student
   */
  async getStudentCertificates(studentId: string): Promise<Certificate[]> {
    const response = await axiosInstance.get('/certificates', {
      params: { studentId },
    });
    return response.data.data;
  }
}

export default new CertificateService();
