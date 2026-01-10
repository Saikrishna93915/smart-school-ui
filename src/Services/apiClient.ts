import axios, { type AxiosResponse } from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Enhanced request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timestamp to avoid caching issues
    if (config.method?.toLowerCase() === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    // Log request for debugging
    console.log(`➡️ ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Enhanced error logging
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    };
    
    console.error("❌ API Error:", errorDetails);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = "/login";
      }
    }
    
    // Handle empty response (Unexpected end of JSON input)
    if (error.message.includes('Unexpected end of JSON input')) {
      console.error('⚠️ Server returned empty response. This usually means:');
      console.error('1. Server crashed or returned non-JSON response');
      console.error('2. Network interruption');
      console.error('3. Server timeout');
      
      // Create a proper error object
      const emptyResponseError = new Error('Server returned empty response. Please check server logs.');
      emptyResponseError.name = 'EmptyResponseError';
      return Promise.reject(emptyResponseError);
    }
    
    // Handle network errors
    if (!error.response) {
      const networkError = new Error('Network error. Please check your connection.');
      networkError.name = 'NetworkError';
      return Promise.reject(networkError);
    }
    
    return Promise.reject(error);
  }
);

// Enhanced safe API call helper
export const safeApiCall = async <T>(
  promise: Promise<AxiosResponse<T>>,
  defaultError = "An error occurred"
): Promise<{ data: T | null; error: string | null; rawResponse?: any }> => {
  try {
    const response = await promise;
    
    // Check if response is successful (200-299)
    if (response.status >= 200 && response.status < 300) {
      return { 
        data: response.data, 
        error: null,
        rawResponse: response
      };
    } else {
      // Handle non-2xx responses
      const errorMsg = (response.data as any)?.message || `Request failed with status ${response.status}`;
      return {
        data: null,
        error: errorMsg,
        rawResponse: response
      };
    }
  } catch (error: any) {
    console.error("Safe API call error:", error);
    
    // Handle empty response specifically
    if (error.message.includes('Unexpected end of JSON input')) {
      return {
        data: null,
        error: 'Server returned empty response. The exam might have been created but the response was invalid.',
        rawResponse: null
      };
    }
    
    return {
      data: null,
      error: error?.response?.data?.message || error?.message || defaultError,
      rawResponse: error.response
    };
  }
};

export default apiClient;