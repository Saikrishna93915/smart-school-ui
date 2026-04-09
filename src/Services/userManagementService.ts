/**
 * User Management Service
 * API calls for managing users (teachers, parents, owners)
 */

import apiClient from "@/Services/apiClient";

const BASE_ENDPOINT = "/admin/users";

export const UserManagementService = {
  /**
   * Get all users by role
   */
  async getAllUsers(role: string, search?: string) {
    const params: any = { role };
    if (search) params.search = search;
    
    const res = await apiClient.get(BASE_ENDPOINT, { params });
    return res.data;
  },

  /**
   * Get single user by ID
   */
  async getUserById(id: string) {
    const res = await apiClient.get(`${BASE_ENDPOINT}/${id}`);
    return res.data;
  },

  /**
   * Create new user
   */
  async createUser(userData: {
    name: string;
    email: string;
    phone?: string;
    role: string;
    linkedId?: string;
  }) {
    const res = await apiClient.post(BASE_ENDPOINT, userData);
    return res.data;
  },

  /**
   * Update user details
   */
  async updateUser(id: string, userData: Partial<any>) {
    const res = await apiClient.put(`${BASE_ENDPOINT}/${id}`, userData);
    return res.data;
  },

  /**
   * Reset user password to default
   */
  async resetPassword(id: string) {
    const res = await apiClient.put(`${BASE_ENDPOINT}/${id}/reset-password`);
    return res.data;
  },

  /**
   * Deactivate user
   */
  async deactivateUser(id: string) {
    const res = await apiClient.delete(`${BASE_ENDPOINT}/${id}/deactivate`);
    return res.data;
  },

  /**
   * Delete user permanently
   */
  async deleteUser(id: string) {
    const res = await apiClient.delete(`${BASE_ENDPOINT}/${id}`);
    return res.data;
  },

  /**
   * Get user statistics
   */
  async getUserStats() {
    const res = await apiClient.get(`${BASE_ENDPOINT}/stats`);
    return res.data;
  },

  /**
   * Bulk create users
   */
  async bulkCreateUsers(users: any[]) {
    const res = await apiClient.post(`${BASE_ENDPOINT}/bulk/import`, { users });
    return res.data;
  }
};
