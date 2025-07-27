import api from './api';

export interface Call {
  id: number;
  call_sid: string;
  from_number: string;
  to_number: string;
  status: string;
  duration?: number;
  created_at: string;
  updated_at: string;
}

export interface Transcript {
  id: number;
  call_id: number;
  text: string;
  speaker: string;
  timestamp: string;
}

export interface Alert {
  id: number;
  call_id: number;
  alert_type: string;
  description: string;
  confidence?: number;
  created_at: string;
}

export interface CallWithDetails extends Call {
  transcripts?: Transcript[];
  alerts?: Alert[];
}

const callService = {
  // Get all calls with optional pagination
  getCalls: async (page = 1, limit = 10): Promise<{ calls: Call[], total: number }> => {
    try {
      const response = await api.get(`/api/calls?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching calls:', error);
      throw error;
    }
  },

  // Get a single call by ID with its transcripts and alerts
  getCallById: async (id: number): Promise<CallWithDetails> => {
    try {
      const response = await api.get(`/api/calls/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching call with ID ${id}:`, error);
      throw error;
    }
  },

  // Create a new call
  createCall: async (callData: {
    call_sid: string;
    from_number: string;
    to_number: string;
    status: string;
    duration?: number;
  }): Promise<Call> => {
    try {
      const response = await api.post('/api/calls', callData);
      return response.data;
    } catch (error) {
      console.error('Error creating call:', error);
      throw error;
    }
  },

  // Update an existing call
  updateCall: async (id: number, callData: {
    status?: string;
    duration?: number;
  }): Promise<Call> => {
    try {
      const response = await api.patch(`/api/calls/${id}`, callData);
      return response.data;
    } catch (error) {
      console.error(`Error updating call with ID ${id}:`, error);
      throw error;
    }
  },

  // Get transcripts for a call
  getCallTranscripts: async (callId: number): Promise<Transcript[]> => {
    try {
      const response = await api.get(`/api/calls/${callId}/transcripts`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching transcripts for call with ID ${callId}:`, error);
      throw error;
    }
  },

  // Get alerts for a call
  getCallAlerts: async (callId: number): Promise<Alert[]> => {
    try {
      const response = await api.get(`/api/calls/${callId}/alerts`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching alerts for call with ID ${callId}:`, error);
      throw error;
    }
  },
};

export default callService;
