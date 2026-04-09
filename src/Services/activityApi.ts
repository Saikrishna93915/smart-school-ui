import apiClient from './apiClient';

/**
 * Activity API Service
 * Handles fetching recent activities and top defaulters
 */

export const activityApi = {
  /**
   * Get recent activities
   * @param {number} limit - Number of activities to fetch (default: 20)
   * @param {string} type - Activity type filter (default: 'all')
   * @param {number} days - Number of days to look back (default: 7)
   * @param {string} feeSort - Sort fees by highest or lowest (default: 'highest')
   */
  getRecentActivities: async (limit = 20, type = 'all', days = 7, feeSort = 'highest') => {
    try {
      const response = await apiClient.get(
        `/activities/recent?limit=${limit}&type=${type}&days=${days}&feeSort=${feeSort}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  },

  /**
   * Get top fee defaulters
   * @param {number} limit - Number of defaulters to fetch (default: 10)
   */
  getTopDefaulters: async (limit = 10) => {
    try {
      const response = await apiClient.get(`/activities/top-defaulters?limit=${limit}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching top defaulters:', error);
      throw error;
    }
  }
};

export default activityApi;
