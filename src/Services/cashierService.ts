import apiClient from "./apiClient";

export const cashierService = {
  getDashboardStats: () => apiClient.get("/cashier/dashboard"),
  getDailyCollectionReport: (date?: string) =>
    apiClient.get("/cashier/daily-report", { params: date ? { date } : {} }),
  getCashierReceipts: (params?: Record<string, unknown>) =>
    apiClient.get("/cashier/receipts", { params }),
  voidTransaction: (transactionId: string, payload: { reason: string }) =>
    apiClient.post(`/cashier/transactions/${transactionId}/void`, payload),
  markReceiptPrinted: (receiptId: string) =>
    apiClient.post(`/cashier/receipts/${receiptId}/print`),
  emailReceipt: (transactionId: string, payload: { email: string }) =>
    apiClient.post(`/cashier/receipts/${transactionId}/email`, payload),
  
  // Shift Management
  getCurrentShift: () => apiClient.get("/cashier/statement/shift/current"),
  getShifts: (params?: Record<string, unknown>) =>
    apiClient.get("/cashier/statement/shifts", { params }),
  openShift: (payload: { openingBalance: number }) =>
    apiClient.post("/cashier/statement/shift/open", payload),
  closeShift: (shiftId: string, payload: {
    closingBalance: number;
    cashInHand: number;
    notes?: string;
    variance?: number;
  }) =>
    apiClient.post(`/cashier/statement/shift/close/${shiftId}`, payload),
  
  // Transaction History
  getStatement: (params?: Record<string, unknown>) =>
    apiClient.get("/cashier/statement", { params }),
  getTransactionDetails: (transactionId: string) =>
    apiClient.get(`/cashier/statement/${transactionId}`),
  exportStatement: (payload: { dateFrom: string; dateTo: string; format?: string }) =>
    apiClient.post("/cashier/statement/export", payload),
};

export default cashierService;
