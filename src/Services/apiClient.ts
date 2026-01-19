import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

// API configuration
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  TIMEOUT: 30000,
  RETRY_COUNT: 1,
  RETRY_DELAY: 1000
} as const;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: API_CONFIG.TIMEOUT,
});

// Enhanced request interceptor with better typing
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("auth_token") || 
                  localStorage.getItem("token");
    
    // Ensure headers and params objects exist so assignments are safe for the stricter axios types
    config.headers = config.headers ?? {};
    config.params = config.params ?? {};

    // Add authorization header if token exists
    if (token) {
      (config.headers as Record<string, any>).Authorization = `Bearer ${token}`;
    }
    
    // Add cache-busting parameter for GET requests
    if (config.method?.toLowerCase() === 'get') {
      (config.params as Record<string, any>)._t = Date.now();
    }
    
    // Log request in development mode
    if (import.meta.env.DEV) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, 
                  config.data ? { data: config.data } : '');
    }
    
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with structured error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error details
    console.error("❌ API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
    });
    
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      handleUnauthorizedError();
      return Promise.reject(error);
    }
    
    // Handle 429 Too Many Requests - implement retry logic
    if (error.response?.status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;
      return retryRequest(originalRequest);
    }
    
    // Handle network errors
    if (!error.response) {
      return Promise.reject(createNetworkError());
    }
    
    // Handle server errors (500+)
    if (error.response?.status >= 500) {
      return Promise.reject(createServerError(error));
    }
    
    // Handle client errors (400-499)
    return Promise.reject(createClientError(error));
  }
);

// Helper functions for error handling
const handleUnauthorizedError = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  
  // Only redirect if not already on login page
  if (!window.location.pathname.includes('/login')) {
    window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
  }
};

const retryRequest = async (originalRequest: any) => {
  await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
  return apiClient(originalRequest);
};

const createNetworkError = () => {
  const error = new Error("Network error. Please check your internet connection.");
  error.name = "NetworkError";
  return error;
};

const createServerError = (originalError: any) => {
  const error = new Error(
    originalError.response?.data?.message || 
    `Server error (${originalError.response?.status}). Please try again later.`
  );
  error.name = "ServerError";
  (error as any).status = originalError.response?.status;
  return error;
};

const createClientError = (originalError: any) => {
  const errorMessage = originalError.response?.data?.message || 
                       originalError.response?.data?.error ||
                       `Request failed with status ${originalError.response?.status}`;
  
  const error = new Error(errorMessage);
  error.name = "ClientError";
  (error as any).status = originalError.response?.status;
  (error as any).data = originalError.response?.data;
  return error;
};

// Enhanced safe API call helper with TypeScript generics
export const safeApiCall = async <T = any>(
  promise: Promise<AxiosResponse<T>>,
  options: {
    defaultError?: string;
    showToast?: boolean;
    logError?: boolean;
  } = {}
): Promise<{
  data: T | null;
  error: string | null;
  status: number | null;
  success: boolean;
}> => {
  const { 
    defaultError = "An error occurred while processing your request.", 
    showToast = true,
    logError = true
  } = options;

  try {
    const response = await promise;
    
    if (response.status >= 200 && response.status < 300) {
      return {
        data: response.data,
        error: null,
        status: response.status,
        success: true
      };
    } else {
      const errorMsg = (response.data as any)?.message || 
                      `Request failed with status ${response.status}`;
      
      if (logError) {
        console.error(`API Error (${response.status}):`, errorMsg);
      }
      
      // Optional: Show toast notification
      if (showToast && typeof window !== 'undefined') {
        // You can integrate with your toast system here
        // toast.error(errorMsg);
      }
      
      return {
        data: null,
        error: errorMsg,
        status: response.status,
        success: false
      };
    }
  } catch (error: any) {
    const errorMsg = error?.message || defaultError;
    
    if (logError) {
      console.error("API call failed:", error);
    }
    
    // Handle specific error types
    if (error.name === 'NetworkError') {
      // Show network error message
      if (showToast && typeof window !== 'undefined') {
        // toast.error("Please check your internet connection.");
      }
    }
    
    return {
      data: null,
      error: errorMsg,
      status: error?.status || null,
      success: false
    };
  }
};

// Helper function for making API calls with common patterns
export const apiHelpers = {
  // GET request helper
  get: async <T = any>(url: string, config?: AxiosRequestConfig) => {
    return safeApiCall<T>(apiClient.get(url, config));
  },
  
  // POST request helper
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return safeApiCall<T>(apiClient.post(url, data, config));
  },
  
  // PUT request helper
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return safeApiCall<T>(apiClient.put(url, data, config));
  },
  
  // PATCH request helper
  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return safeApiCall<T>(apiClient.patch(url, data, config));
  },
  
  // DELETE request helper
  delete: async <T = any>(url: string, config?: AxiosRequestConfig) => {
    return safeApiCall<T>(apiClient.delete(url, config));
  },
  
  // Upload file helper
  upload: async <T = any>(url: string, file: File, fieldName = 'file') => {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    return safeApiCall<T>(
      apiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    );
  },
  
  // Download file helper
  download: async (url: string, filename?: string) => {
    try {
      const response = await apiClient.get(url, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || `download-${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Export the enhanced apiClient
export default apiClient;

// Type exports for better TypeScript support
export type { AxiosRequestConfig, AxiosResponse };
export type ApiResponse<T = any> = {
  students: boolean;
  message: string | null;
  receiptNumber: string | undefined;
  data: T | null;
  error: string | null;
  status: number | null;
  success: boolean;
};