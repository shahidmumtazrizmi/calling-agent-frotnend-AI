import api from './api';

export interface CallStatistics {
  total_calls: number;
  completed_calls: number;
  in_progress_calls: number;
  failed_calls: number;
  average_duration: number;
}

export interface CallVolumeData {
  date: string;
  count: number;
}

export interface AlertStatistics {
  total_alerts: number;
  potential_scam_alerts: number;
  suspicious_activity_alerts: number;
  other_alerts: number;
}

export interface ScamPhrase {
  phrase: string;
  count: number;
}

const analyticsService = {
  // Get overall call statistics
  getCallStatistics: async (): Promise<CallStatistics> => {
    try {
      const response = await api.get('/api/analytics/call-statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching call statistics:', error);
      throw error;
    }
  },

  // Get daily call volume
  getDailyCallVolume: async (days = 7): Promise<CallVolumeData[]> => {
    try {
      const response = await api.get(`/api/analytics/call-volume/daily?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching daily call volume:', error);
      throw error;
    }
  },

  // Get weekly call volume
  getWeeklyCallVolume: async (weeks = 4): Promise<CallVolumeData[]> => {
    try {
      const response = await api.get(`/api/analytics/call-volume/weekly?weeks=${weeks}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching weekly call volume:', error);
      throw error;
    }
  },

  // Get monthly call volume
  getMonthlyCallVolume: async (months = 6): Promise<CallVolumeData[]> => {
    try {
      const response = await api.get(`/api/analytics/call-volume/monthly?months=${months}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly call volume:', error);
      throw error;
    }
  },

  // Get call volume for a specific date range
  getCallVolumeByDateRange: async (startDate: string, endDate: string): Promise<CallVolumeData[]> => {
    try {
      const response = await api.get(`/api/analytics/call-volume/range?start_date=${startDate}&end_date=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching call volume by date range:', error);
      throw error;
    }
  },

  // Get alert statistics
  getAlertStatistics: async (): Promise<AlertStatistics> => {
    try {
      const response = await api.get('/api/analytics/alert-statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching alert statistics:', error);
      throw error;
    }
  },

  // Get top scam phrases
  getTopScamPhrases: async (limit = 10): Promise<ScamPhrase[]> => {
    try {
      const response = await api.get(`/api/analytics/top-scam-phrases?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching top scam phrases:', error);
      throw error;
    }
  },
};

export default analyticsService;
