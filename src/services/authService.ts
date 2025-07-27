import api from './api';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

const TOKEN_KEY = 'voice_agent_token';
const USER_KEY = 'voice_agent_user';

const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      const authData = response.data;
      
      // Store token and user data in localStorage
      localStorage.setItem(TOKEN_KEY, authData.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
      
      // Set the authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${authData.access_token}`;
      
      return authData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Register new user
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.post('/api/auth/register', userData);
      const authData = response.data;
      
      // Store token and user data in localStorage
      localStorage.setItem(TOKEN_KEY, authData.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
      
      // Set the authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${authData.access_token}`;
      
      return authData;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Logout user
  logout: (): void => {
    // Remove token and user data from localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    // Remove the authorization header
    delete api.defaults.headers.common['Authorization'];
  },

  // Get current user
  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem(USER_KEY);
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  // Initialize auth state from localStorage
  initializeAuth: (): void => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },

  // Refresh token
  refreshToken: async (): Promise<AuthResponse> => {
    try {
      const response = await api.post('/api/auth/refresh');
      const authData = response.data;
      
      // Update token in localStorage
      localStorage.setItem(TOKEN_KEY, authData.access_token);
      
      // Update the authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${authData.access_token}`;
      
      return authData;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout the user
      authService.logout();
      throw error;
    }
  },
};

// Initialize auth state when the service is imported
authService.initializeAuth();

export default authService;
