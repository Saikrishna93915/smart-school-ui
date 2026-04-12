// services/settingsService.ts
import apiClient from './apiClient';

const API_ORIGIN = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

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
  totalClasses?: number;
  totalSubjects?: number;
  totalStudents?: number;
  totalStaff?: number;
}

export interface AcademicYear {
  current: string;
  startDate: string;
  endDate: string;
  terms: number;
  sessions: string[];
}

export interface NotificationSetting {
  id?: number;
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
    current: '2024-2025',
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

// =================== DATA MAPPING FUNCTIONS ===================
// Map backend school data to frontend format
const mapSchoolData = (backendSchool: any): SchoolInfo => {
  if (!backendSchool) return defaultSettings.schoolInfo!;
  
  const addr = backendSchool.address;
  let addressStr = '';
  if (addr) {
    const parts = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean);
    addressStr = parts.join(', ');
  }
  
  // Handle logo - can be string or object with url property
  let logoPath = '';
  if (backendSchool.logo) {
    if (typeof backendSchool.logo === 'object' && backendSchool.logo.url) {
      logoPath = backendSchool.logo.url;
    } else if (typeof backendSchool.logo === 'string') {
      logoPath = backendSchool.logo;
    }
  }
  
  const resolvedLogo = logoPath
    ? (String(logoPath).startsWith('http')
        ? logoPath
        : `${API_ORIGIN}${logoPath}`)
    : null;

  return {
    name: backendSchool.name || '',
    code: backendSchool.code || '',
    email: backendSchool.email || '',
    phone: backendSchool.phone || '',
    address: addressStr || '',
    established: backendSchool.establishedYear?.toString() || '',
    principal: backendSchool.principal?.name || '',
    board: backendSchool.board || '',
    medium: backendSchool.medium || '',
    website: backendSchool.website || '',
    logo: resolvedLogo,
    motto: backendSchool.motto || '',
    // Include statistics from backend
    totalClasses: backendSchool.statistics?.totalClasses || 36,
    totalSubjects: backendSchool.statistics?.totalSubjects || 18,
    totalStudents: backendSchool.statistics?.totalStudents || 0,
    totalStaff: backendSchool.statistics?.totalStaff || 0
  };
};

// Map backend academic data to frontend format
const mapAcademicData = (backendAcademic: any): AcademicYear => {
  if (!backendAcademic) return defaultSettings.academicYear!;
  
  const sessions = backendAcademic.sessions?.map((s: any) => s.name) || [];
  
  return {
    current: backendAcademic.year || '',
    startDate: backendAcademic.startDate || '',
    endDate: backendAcademic.endDate || '',
    terms: backendAcademic.terms?.length || 0,
    sessions: sessions
  };
};

// Map backend security data to frontend format
const mapSecurityData = (backendSecurity: any): SecuritySettings => {
  if (!backendSecurity) return defaultSettings.security!;
  
  return {
    twoFactor: backendSecurity.authentication?.twoFactorEnabled || false,
    sessionTimeout: backendSecurity.authentication?.sessionTimeout || 30,
    passwordAge: backendSecurity.passwordPolicy?.expiryDays || 90,
    failedAttempts: backendSecurity.loginSecurity?.maxFailedAttempts || 3,
    ipWhitelist: backendSecurity.loginSecurity?.ipWhitelist || [],
    apiKey: backendSecurity.apiSecurity?.apiKey || undefined
  };
};

// Map backend billing data to frontend format
const mapBillingData = (backendBilling: any): BillingInfo => {
  if (!backendBilling) return defaultSettings.billing!;
  
  const currentPlan = backendBilling.currentPlan || {};
  const limits = backendBilling.limits || {};
  
  return {
    plan: currentPlan.displayName || 'Enterprise Plan',
    status: currentPlan.status || 'active',
    price: currentPlan.price?.amount ? `₹${currentPlan.price.amount.toLocaleString()}` : '₹24,999',
    period: currentPlan.price?.period || 'month',
    students: limits.students?.current || 0,
    staff: limits.staff?.current || 0,
    storage: limits.storage?.used ? `${limits.storage.used} GB` : '250 GB',
    aiCredits: 'Unlimited',
    features: currentPlan.features || defaultSettings.billing!.features
  };
};

const mapNotificationData = (backendNotifications: any[]): NotificationSetting[] => {
  if (!Array.isArray(backendNotifications)) {
    return defaultSettings.notifications || [];
  }

  return backendNotifications.map((item, index) => ({
    id: item.id ?? index + 1,
    name: item.name || `Notification ${index + 1}`,
    channels: Array.isArray(item.channels) ? item.channels : [],
    enabled: Boolean(item.enabled)
  }));
};

// =================== SETTINGS API ===================
export const settingsApi = {
  // Get all settings
  getAllSettings: async (): Promise<{ success: boolean; data: SettingsData }> => {
    try {
      const response = await apiClient.get(SETTINGS_BASE);
      
      // Map backend response to frontend format
      const backendData = response.data.data;
      return {
        success: response.data.success,
        data: {
          schoolInfo: mapSchoolData(backendData.school),
          academicYear: mapAcademicData(backendData.academic),
          notifications: mapNotificationData(backendData.notifications || []),
          security: mapSecurityData(backendData.security),
          billing: mapBillingData(backendData.billing),
          systemHealth: backendData.systemHealth || defaultSettings.systemHealth
        }
      };
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  // Get settings by category
  getSettingsByCategory: async (category: string): Promise<any> => {
    try {
      const response = await apiClient.get(`${SETTINGS_BASE}/${category}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${category} settings:`, error);
      throw error;
    }
  },

  // Update school profile
  updateSchoolProfile: async (data: Partial<SchoolInfo>): Promise<any> => {
    try {
      // Map frontend format to backend format
      const backendPayload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address ? { street: data.address } : undefined,
        website: data.website,
        principal: data.principal ? { name: data.principal } : undefined,
        board: data.board ? String(data.board).toUpperCase() : undefined,
        medium: data.medium
          ? ({ english: 'English', hindi: 'Hindi', both: 'Both', regional: 'Regional' } as Record<string, string>)[String(data.medium).toLowerCase()] || data.medium
          : undefined,
        motto: data.motto
      };

      const sanitizedPayload = Object.fromEntries(
        Object.entries(backendPayload).filter(([, value]) => value !== undefined && value !== null && value !== '')
      );
      
      const response = await apiClient.put(`${SETTINGS_BASE}/school`, sanitizedPayload);
      return {
        success: response.data.success,
        data: mapSchoolData(response.data.data)
      };
    } catch (error) {
      console.error('Error updating school profile:', error);
      throw error;
    }
  },

  // Update academic settings
  updateAcademicSettings: async (data: Partial<AcademicYear>): Promise<any> => {
    try {
      const payload = {
        year: data.current,
        startDate: data.startDate,
        endDate: data.endDate,
        sessions: (data.sessions || []).map((name) => ({ name, type: 'regular' }))
      };

      const response = await apiClient.put(`${SETTINGS_BASE}/academic`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating academic settings:', error);
      throw error;
    }
  },

  // Update notification settings
  updateNotificationSettings: async (data: NotificationSetting[] | { notifications: NotificationSetting[] }): Promise<any> => {
    try {
      const payload = Array.isArray(data) ? data : (data?.notifications || []);
      const response = await apiClient.put(`${SETTINGS_BASE}/notifications`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  // Update security settings
  updateSecuritySettings: async (data: Partial<SecuritySettings>): Promise<any> => {
    try {
      const response = await apiClient.put(`${SETTINGS_BASE}/security`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw error;
    }
  },

  // Update billing settings
  updateBillingSettings: async (data: Partial<BillingInfo>): Promise<any> => {
    try {
      const response = await apiClient.put(`${SETTINGS_BASE}/billing`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating billing settings:', error);
      throw error;
    }
  },

  // Update advanced settings
  updateAdvancedSettings: async (data: any): Promise<any> => {
    try {
      const response = await apiClient.put(`${SETTINGS_BASE}/advanced`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating advanced settings:', error);
      throw error;
    }
  },

  // Create backup
  createBackup: async (): Promise<any> => {
    try {
      const response = await apiClient.post(`${SETTINGS_BASE}/backup`, {});
      return response.data;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  },

  // Export data
  exportData: async (format: string): Promise<any> => {
    try {
      const response = await apiClient.post(`${SETTINGS_BASE}/export`, { format });
      return response.data;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  },

  // Get system health
  getSystemHealth: async (): Promise<{ success: boolean; data: SystemHealth }> => {
    try {
      const response = await apiClient.get(`${SETTINGS_BASE}/health`);
      return {
        success: response.data.success,
        data: response.data.data || defaultSettings.systemHealth
      };
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
      
      // Send FormData - axios interceptor will let browser handle Content-Type
      const response = await apiClient.post(`${SETTINGS_BASE}/logo`, formData);
      const relative = response.data?.data?.path || response.data?.data?.logoUrl || '';
      const absolute = relative && !String(relative).startsWith('http')
        ? `${API_ORIGIN}${relative}`
        : relative;

      return {
        ...response.data,
        data: {
          ...response.data.data,
          path: absolute,
          logoUrl: absolute
        }
      };
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  },

  // Regenerate API key
  regenerateApiKey: async (): Promise<{ apiKey: string }> => {
    try {
      const response = await apiClient.post(`${SETTINGS_BASE}/regenerate-key`);
      return response.data;
    } catch (error) {
      console.error('Error regenerating API key:', error);
      throw error;
    }
  },

  // Get all settings summary
  getSettingsSummary: async (): Promise<any> => {
    try {
      const response = await apiClient.get(`${SETTINGS_BASE}/summary`);
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
      const response = await apiClient.post(url);
      return response.data;
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
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
