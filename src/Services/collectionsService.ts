// src/services/collectionsService.ts
import { getStoredToken } from '@/lib/auth/storage';

// Use the same API URL as the rest of the app
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const getAuthHeaders = () => {
  const token = getStoredToken() || localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export interface Collection {
  _id?: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  className: string;
  section: string;
  rollNo: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  amount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  paymentDate: string;
  formattedDate: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled' | 'refunded';
  description: string;
  collectedBy: string;
  recordedById: string;
  createdAt: string;
  updatedAt: string;
  isDefaulterPayment: boolean;
  notes: string;
}

export interface CollectionsResponse {
  success: boolean;
  collections: Collection[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  statistics: {
    totalAmount: number;
    totalCollections: number;
    completedAmount: number;
    completedCount: number;
    pendingAmount: number;
    pendingCount: number;
    successRate: number;
  };
  distributions: {
    methodDistribution: Array<{
      _id: string;
      count: number;
      amount: number;
    }>;
    monthlyTrend: Array<{
      _id: string;
      count: number;
      amount: number;
    }>;
  };
}

export interface StatisticsResponse {
  success: boolean;
  statistics: {
    overall: {
      totalAmount: number;
      totalCollections: number;
      avgAmount: number;
    };
    today: {
      amount: number;
      count: number;
    };
    thisMonth: {
      amount: number;
      count: number;
    };
    weeklyTrend: Array<{
      _id: string;
      amount: number;
      count: number;
    }>;
    topCollectors: Array<{
      _id: string;
      amount: number;
      count: number;
    }>;
    successRate: number;
  };
}

export const collectionsService = {
  // Get collections with filters
  getCollections: async (params: {
    search?: string;
    className?: string;
    status?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    collectedBy?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<CollectionsResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(
      `${API_BASE_URL}/finance/collections?${queryParams}`,
      {
        headers: getAuthHeaders(),
      }
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get collection details
  getCollectionDetails: async (receiptNumber: string) => {
    const response = await fetch(
      `${API_BASE_URL}/finance/collections/${receiptNumber}`,
      {
        headers: getAuthHeaders(),
      }
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },

  // Update collection status
  updateCollectionStatus: async (receiptNumber: string, status: string, notes?: string) => {
    const response = await fetch(
      `${API_BASE_URL}/finance/collections/${receiptNumber}/status`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, notes }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },

  // Export collections to CSV
  exportCollections: async (params: {
    search?: string;
    className?: string;
    status?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(
      `${API_BASE_URL}/finance/collections/export?${queryParams}`,
      {
        headers: getAuthHeaders(),
      }
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.blob();
  },

  // Get statistics
  getStatistics: async (): Promise<StatisticsResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/finance/collections/statistics`,
      {
        headers: getAuthHeaders(),
      }
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },

  // Download receipt
  downloadReceipt: async (receiptNumber: string, format: 'json' | 'html' | 'pdf' = 'json') => {
    const response = await fetch(
      `${API_BASE_URL}/finance/collections/${receiptNumber}/receipt?format=${format}`,
      {
        headers: getAuthHeaders(),
      }
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    if (format === 'html') {
      return response.blob();
    }
    
    return response.json();
  },
};