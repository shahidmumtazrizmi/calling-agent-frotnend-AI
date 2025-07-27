import api from './api';

export interface PhoneNumber {
  id: number;
  phone_number: string;
  friendly_name?: string;
  status: string;
  capabilities?: {
    voice?: boolean;
    sms?: boolean;
    mms?: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface AvailableNumber {
  phone_number: string;
  friendly_name: string;
  locality?: string;
  region?: string;
  postal_code?: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
}

const numberService = {
  // Get all phone numbers with optional pagination
  getNumbers: async (page = 1, limit = 10): Promise<{ numbers: PhoneNumber[], total: number }> => {
    try {
      const response = await api.get(`/api/numbers?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      throw error;
    }
  },

  // Get a single phone number by ID
  getNumberById: async (id: number): Promise<PhoneNumber> => {
    try {
      const response = await api.get(`/api/numbers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching phone number with ID ${id}:`, error);
      throw error;
    }
  },

  // Create a new phone number
  createNumber: async (numberData: {
    phone_number: string;
    friendly_name?: string;
    status: string;
    capabilities?: {
      voice?: boolean;
      sms?: boolean;
      mms?: boolean;
    };
  }): Promise<PhoneNumber> => {
    try {
      const response = await api.post('/api/numbers', numberData);
      return response.data;
    } catch (error) {
      console.error('Error creating phone number:', error);
      throw error;
    }
  },

  // Update an existing phone number
  updateNumber: async (id: number, numberData: {
    friendly_name?: string;
    status?: string;
    capabilities?: {
      voice?: boolean;
      sms?: boolean;
      mms?: boolean;
    };
  }): Promise<PhoneNumber> => {
    try {
      const response = await api.patch(`/api/numbers/${id}`, numberData);
      return response.data;
    } catch (error) {
      console.error(`Error updating phone number with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a phone number
  deleteNumber: async (id: number): Promise<void> => {
    try {
      await api.delete(`/api/numbers/${id}`);
    } catch (error) {
      console.error(`Error deleting phone number with ID ${id}:`, error);
      throw error;
    }
  },

  // Search for available phone numbers
  searchAvailableNumbers: async (params: {
    country_code?: string;
    area_code?: string;
    contains?: string;
    limit?: number;
  }): Promise<{ numbers: AvailableNumber[], count: number }> => {
    try {
      const response = await api.get('/api/numbers/search', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching for available phone numbers:', error);
      throw error;
    }
  },

  // Purchase a phone number
  purchaseNumber: async (params: {
    phone_number: string;
    friendly_name?: string;
  }): Promise<PhoneNumber> => {
    try {
      const response = await api.post('/api/numbers/purchase', params);
      return response.data;
    } catch (error) {
      console.error('Error purchasing phone number:', error);
      throw error;
    }
  },
};

export default numberService;
