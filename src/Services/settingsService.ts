// services/settingsService.ts
import axios from 'axios';

// Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Base settings URL
const SETTINGS_BASE = '/settings';

// =================== SETTINGS TYPES ===================
export interface SchoolInfo {
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  established: string;
  principal: string;
  board: string;
  medium: string;
  website: string;
  logo: string | null;
  motto: string;
}

export interface AcademicYear {
  current: string;
  startDate: string;
  endDate: string;
  terms: number;
  sessions: string[];
}

export interface NotificationSetting {
  id: number;
  name: string;
  channels: string[];
  enabled: boolean;
}

export interface SecuritySettings {
  twoFactor?: boolean;
  lastLogin?: string;
  ipWhitelist?: string[];
  sessionTimeout?: number;
  passwordAge?: number;
  failedAttempts?: number;
  apiKey?: string;
}

export interface BillingInfo {
  plan?: string;
  status?: string;
  price?: string;
  period?: string;
  nextBilling?: string;
  students?: number;
  staff?: number;
  storage?: string;
  aiCredits?: string;
  features?: string[];
}

export interface SystemHealth {
  uptime?: string;
  responseTime?: string;
  storage?: string;
  memory?: string;
  cpu?: string;
  activeUsers?: number;
  database?: string;
  services?: string[];
}

export interface SettingsData {
  schoolInfo?: SchoolInfo;
  academicYear?: AcademicYear;
  notifications?: NotificationSetting[];
  security?: SecuritySettings;
  billing?: BillingInfo;
  systemHealth?: SystemHealth;
}

// =================== SETTINGS API ===================
export const settingsApi = {
  // Get all settings
  getAllSettings: async (): Promise<{ success: boolean; data: SettingsData }> => {
    try {
      const response = await api.get(SETTINGS_BASE);
      return response.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  // Get settings by category
  getSettingsByCategory: async (category: string): Promise<any> => {
    try {
      const response = await api.get(`${SETTINGS_BASE}/${category}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${category} settings:`, error);
      throw error;
    }
  },

  // Update school profile
  updateSchoolProfile: async (data: Partial<SchoolInfo>): Promise<any> => {
    try {
      const response = await api.put(`${SETTINGS_BASE}/school`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating school profile:', error);
      throw error;
    }
  },

  // Update academic settings
  updateAcademicSettings: async (data: Partial<AcademicYear>): Promise<any> => {
    try {
      const response = await api.put(`${SETTINGS_BASE}/academic`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating academic settings:', error);
      throw error;
    }
  },

  // Update notification settings
  updateNotificationSettings: async (data: { notifications: NotificationSetting[] }): Promise<any> => {
    try {
      const response = await api.put(`${SETTINGS_BASE}/notifications`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  // Update security settings
  updateSecuritySettings: async (data: Partial<SecuritySettings>): Promise<any> => {
    try {
      const response = await api.put(`${SETTINGS_BASE}/security`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw error;
    }
  },

  // Update billing settings
  updateBillingSettings: async (data: Partial<BillingInfo>): Promise<any> => {
    try {
      const response = await api.put(`${SETTINGS_BASE}/billing`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating billing settings:', error);
      throw error;
    }
  },

  // Update advanced settings
  updateAdvancedSettings: async (data: any): Promise<any> => {
    try {
      const response = await api.put(`${SETTINGS_BASE}/advanced`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating advanced settings:', error);
      throw error;
    }
  },

  // Create backup
  createBackup: async (): Promise<{ backupId: number; estimatedTime: string }> => {
    try {
      const response = await api.post(`${SETTINGS_BASE}/backup`, {});
      return response.data;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  },

  // Export data
  exportData: async (format: string): Promise<{ exportId: number; downloadUrl: string; expiresAt: string }> => {
    try {
      const response = await api.post(`${SETTINGS_BASE}/export`, { format });
      return response.data;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  },

  // Get system health
  getSystemHealth: async (): Promise<{ success: boolean; data: SystemHealth }> => {
    try {
      const response = await api.get(`${SETTINGS_BASE}/health`);
      return response.data;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  },

  // Upload logo (multipart form)
  uploadLogo: async (file: File): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await api.post(`${SETTINGS_BASE}/logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  },

  // Regenerate API key
  regenerateApiKey: async (): Promise<{ apiKey: string }> => {
    try {
      const response = await api.post(`${SETTINGS_BASE}/regenerate-key`);
      return response.data;
    } catch (error) {
      console.error('Error regenerating API key:', error);
      throw error;
    }
  },

  // Get all settings summary
  getSettingsSummary: async (): Promise<any> => {
    try {
      const response = await api.get(`${SETTINGS_BASE}/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching settings summary:', error);
      throw error;
    }
  },

  // Reset settings to default
  resetSettings: async (category?: string): Promise<any> => {
    try {
      const url = category ? `${SETTINGS_BASE}/reset/${category}` : `${SETTINGS_BASE}/reset`;
      const response = await api.post(url);
      return response.data;
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }
};

// =================== DEFAULT SETTINGS DATA ===================
export const defaultSettings: SettingsData = {
  schoolInfo: {
    name: 'Silver Sand International School',
    code: 'SSIS-2024-001',
    email: 'info@silversand.edu',
    phone: '+91 11 2654 9876',
    address: '123 Knowledge Park, Sector 62, Noida, Uttar Pradesh - 201309',
    established: '2005',
    principal: 'Dr. Ramesh Kumar',
    board: 'CBSE',
    medium: 'English',
    website: 'https://silversand.edu',
    logo: null,
    motto: 'Excellence Through Innovation'
  },
  academicYear: {
    current: '2024-25',
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    terms: 2,
    sessions: ['April-September', 'October-March']
  },
  notifications: [
    { id: 1, name: 'Attendance Alerts', channels: ['email', 'sms', 'whatsapp'], enabled: true },
    { id: 2, name: 'Fee Reminders', channels: ['email', 'sms'], enabled: true },
    { id: 3, name: 'Exam Notifications', channels: ['email', 'whatsapp'], enabled: true },
    { id: 4, name: 'AI Insights', channels: ['email'], enabled: true },
    { id: 5, name: 'Emergency Alerts', channels: ['sms', 'whatsapp', 'voice'], enabled: true },
    { id: 6, name: 'Parent-Teacher Meetings', channels: ['email', 'whatsapp'], enabled: true },
    { id: 7, name: 'Library Reminders', channels: ['email'], enabled: false },
    { id: 8, name: 'Transport Updates', channels: ['whatsapp', 'sms'], enabled: true }
  ],
  security: {
    twoFactor: true,
    lastLogin: '2024-12-15T10:30:00',
    ipWhitelist: ['192.168.1.0/24', '10.0.0.0/16'],
    sessionTimeout: 30,
    passwordAge: 90,
    failedAttempts: 3
  },
  billing: {
    plan: 'Enterprise Plan',
    status: 'active',
    price: '₹24,999',
    period: 'month',
    nextBilling: '2025-01-01',
    students: 1248,
    staff: 45,
    storage: '250 GB',
    aiCredits: 'Unlimited',
    features: [
      'Unlimited Students',
      'Advanced AI Analytics',
      'Priority Support',
      'Custom Modules',
      'API Access',
      'White Labeling',
      '99.9% Uptime SLA'
    ]
  },
  systemHealth: {
    uptime: '99.95%',
    responseTime: '128ms',
    storage: '45%',
    memory: '68%',
    cpu: '32%',
    activeUsers: 142
  }
};

// Plan features for comparison
export const planFeatures = {
  basic: ['Up to 500 students', 'Basic AI Insights', 'Email Support', 'Standard Modules'],
  professional: ['Up to 2000 students', 'Advanced Analytics', 'Priority Support', 'Custom Reports'],
  enterprise: ['Unlimited Students', 'Full AI Suite', '24/7 Support', 'API Access', 'White Label']
};

// Helper function to get safe value
export const getSafeValue = <T>(value: T | undefined, defaultValue: T): T => {
  return value !== undefined ? value : defaultValue;
};

// Export all
export default {
  settingsApi,
  defaultSettings,
  planFeatures,
  getSafeValue
};