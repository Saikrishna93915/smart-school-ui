// services/transportService.ts - UPDATED TO MATCH TRANSPORT.TSX
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

// Base transport URL
const TRANSPORT_BASE = '/transport';

// =================== VEHICLE API ===================
export const vehicleApi = {
  getAllVehicles: async (params?: any) => {
    const response = await api.get(`${TRANSPORT_BASE}/vehicles`, { params });
    return response.data;
  },

  getVehicleById: async (id: string) => {
    const response = await api.get(`${TRANSPORT_BASE}/vehicles/${id}`);
    return response.data;
  },

  createVehicle: async (data: any) => {
    const response = await api.post(`${TRANSPORT_BASE}/vehicles`, data);
    return response.data;
  },

  updateVehicle: async (id: string, data: any) => {
    const response = await api.put(`${TRANSPORT_BASE}/vehicles/${id}`, data);
    return response.data;
  },

  updateVehicleLocation: async (id: string, data: any) => {
    const response = await api.patch(`${TRANSPORT_BASE}/vehicles/${id}/location`, data);
    return response.data;
  },

  updateFuelLevel: async (id: string, data: any) => {
    const response = await api.patch(`${TRANSPORT_BASE}/vehicles/${id}/fuel`, data);
    return response.data;
  },

  assignDriver: async (id: string, data: any) => {
    const response = await api.post(`${TRANSPORT_BASE}/vehicles/${id}/assign-driver`, data);
    return response.data;
  },

  getVehicleStats: async () => {
    const response = await api.get(`${TRANSPORT_BASE}/vehicles-stats`);
    return response.data;
  },

  deleteVehicle: async (id: string) => {
    const response = await api.delete(`${TRANSPORT_BASE}/vehicles/${id}`);
    return response.data;
  },

  getVehicleByNumber: async (vehicleNo: string) => {
    const response = await api.get(`${TRANSPORT_BASE}/vehicles/number/${vehicleNo}`);
    return response.data;
  },

  getVehiclesByStatus: async (status: string) => {
    const response = await api.get(`${TRANSPORT_BASE}/vehicles/status/${status}`);
    return response.data;
  }
};

// =================== DRIVER API ===================
export const driverApi = {
  getAllDrivers: async (params?: any) => {
    const response = await api.get(`${TRANSPORT_BASE}/drivers`, { params });
    return response.data;
  },

  createDriver: async (data: any) => {
    const response = await api.post(`${TRANSPORT_BASE}/drivers`, data);
    return response.data;
  },

  updateDriver: async (id: string, data: any) => {
    const response = await api.put(`${TRANSPORT_BASE}/drivers/${id}`, data);
    return response.data;
  },

  getDriverStats: async () => {
    const response = await api.get(`${TRANSPORT_BASE}/drivers-stats`);
    return response.data;
  }
};

// =================== ROUTE API ===================
export const routeApi = {
  getAllRoutes: async (params?: any) => {
    const response = await api.get(`${TRANSPORT_BASE}/routes`, { params });
    return response.data;
  },

  createRoute: async (data: any) => {
    const response = await api.post(`${TRANSPORT_BASE}/routes`, data);
    return response.data;
  },

  updateRoute: async (id: string, data: any) => {
    const response = await api.put(`${TRANSPORT_BASE}/routes/${id}`, data);
    return response.data;
  },

  assignVehicle: async (routeId: string, vehicleId: string) => {
    const response = await api.put(`${TRANSPORT_BASE}/routes/${routeId}`, {
      assignedVehicle: vehicleId
    });
    return response.data;
  },

  getRouteStats: async () => {
    const response = await api.get(`${TRANSPORT_BASE}/routes-stats`);
    return response.data;
  }
};

// =================== MAINTENANCE API ===================
export const maintenanceApi = {
  getAllMaintenance: async (params?: any) => {
    const response = await api.get(`${TRANSPORT_BASE}/maintenance`, { params });
    return response.data;
  },

  createMaintenance: async (data: any) => {
    const response = await api.post(`${TRANSPORT_BASE}/maintenance`, data);
    return response.data;
  },

  updateMaintenanceStatus: async (id: string, data: any) => {
    const response = await api.patch(`${TRANSPORT_BASE}/maintenance/${id}/status`, data);
    return response.data;
  },

  getMaintenanceStats: async () => {
    const response = await api.get(`${TRANSPORT_BASE}/maintenance-stats`);
    return response.data;
  },

  getMaintenanceByVehicle: async (vehicleId: string) => {
    const response = await api.get(`${TRANSPORT_BASE}/maintenance/vehicle/${vehicleId}`);
    return response.data;
  }
};

// =================== FUEL LOG API ===================
export const fuelLogApi = {
  getAllFuelLogs: async (params?: any) => {
    const response = await api.get(`${TRANSPORT_BASE}/fuel-logs`, { params });
    return response.data;
  },

  createFuelLog: async (data: any) => {
    const response = await api.post(`${TRANSPORT_BASE}/fuel-logs`, data);
    return response.data;
  },

  getFuelStats: async (params?: any) => {
    const response = await api.get(`${TRANSPORT_BASE}/fuel-stats`, { params });
    return response.data;
  },

  getFuelLogsByVehicle: async (vehicleId: string) => {
    const response = await api.get(`${TRANSPORT_BASE}/fuel-logs/vehicle/${vehicleId}`);
    return response.data;
  }
};

// =================== CLEANER API ===================
export const cleanerApi = {
  getAllCleaners: async (params?: any) => {
    const response = await api.get(`${TRANSPORT_BASE}/cleaners`, { params });
    return response.data;
  },

  getCleanerById: async (id: string) => {
    const response = await api.get(`${TRANSPORT_BASE}/cleaners/${id}`);
    return response.data;
  },

  assignCleanerToVehicle: async (data: any) => {
    const response = await api.post(`${TRANSPORT_BASE}/cleaners/assign`, data);
    return response.data;
  }
};

// =================== DASHBOARD API ===================
export const dashboardApi = {
  getDashboardStats: async () => {
    const response = await api.get(`${TRANSPORT_BASE}/dashboard-stats`);
    return response.data;
  },

  generateReport: async (data: any) => {
    const response = await api.post(`${TRANSPORT_BASE}/reports/generate`, data);
    return response.data;
  }
};

// =================== SOCKET.IO SERVICE ===================
class SocketService {
  private socket: any = null;
  private callbacks: Map<string, Function[]> = new Map();

  connect() {
    // For now, just mock the connection
    console.log('Socket connecting...');
    this.socket = { connected: true };
    
    // Mock connection success
    setTimeout(() => {
      console.log('Socket connected (mock)');
      this.triggerCallbacks('connect', {});
    }, 500);
  }

  disconnect() {
    if (this.socket) {
      console.log('Socket disconnecting...');
      this.socket = null;
      this.triggerCallbacks('disconnect', {});
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data: any) {
    console.log(`Emitting ${event}:`, data);
    // Mock emit - in real implementation, this would send to WebSocket
  }

  private triggerCallbacks(event: string, data: any) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Mock receiving events for development
  mockReceiveEvent(event: string, data: any) {
    console.log(`Mock receiving ${event}:`, data);
    this.triggerCallbacks(event, data);
  }
}

export const socketService = new SocketService();

// Health check
export const healthCheck = async () => {
  const response = await api.get(`${TRANSPORT_BASE}/health`);
  return response.data;
};

// Export all
export default {
  vehicleApi,
  driverApi,
  routeApi,
  maintenanceApi,
  fuelLogApi,
  cleanerApi,
  dashboardApi,
  socketService,
  healthCheck
};