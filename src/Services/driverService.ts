import apiClient from "./apiClient";

export const driverService = {
  getDashboard: () => apiClient.get("/driver/dashboard"),
  getMyProfile: () => apiClient.get("/driver/profile"),
  getTodaySchedule: () => apiClient.get("/driver/today-schedule"),
  getMyStudents: () => apiClient.get("/driver/my-students"),
  startTrip: (data: Record<string, unknown>) => apiClient.post("/driver/start-trip", data),
  endTrip: (tripId: string, data: Record<string, unknown>) => apiClient.post(`/driver/end-trip/${tripId}`, data),
  markStudentBoarded: (tripId: string, studentId: string, status: string) =>
    apiClient.post(`/driver/mark-student/${tripId}/${studentId}`, { status }),
  getTripHistory: (params?: Record<string, unknown>) => apiClient.get("/driver/trip-history", { params }),
  getMyVehicle: () => apiClient.get("/driver/my-vehicle"),
  logFuel: (data: Record<string, unknown>) => apiClient.post("/driver/fuel-log", data),
  getFuelLogs: () => apiClient.get("/driver/fuel-logs"),

  // Vehicle Checklist
  submitChecklist: (data: Record<string, unknown>) => apiClient.post("/driver/vehicle-checklist", data),
  getChecklistHistory: () => apiClient.get("/driver/vehicle-checklist/history"),

  // Incident Reporting
  submitIncidentReport: (data: Record<string, unknown>) => apiClient.post("/driver/incident-report", data),
  getIncidentReports: () => apiClient.get("/driver/incident-reports"),

  // Maintenance Requests
  submitMaintenanceRequest: (data: Record<string, unknown>) => apiClient.post("/driver/maintenance-request", data),
  getMaintenanceRequests: () => apiClient.get("/driver/maintenance-requests"),

  // Route & Navigation
  getRouteDetails: (routeId: string) => apiClient.get(`/driver/route/${routeId}`),
  getAssignedRoutes: () => apiClient.get("/driver/assigned-routes"),
};

export default driverService;
