// Legacy REST API client - kept for backward compatibility
// New code should use graphqlClient from '@/lib/graphql'
import { graphqlClient } from './graphql'
import { API_BASE_URL } from './api-config'

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    graphqlClient.setToken(token);
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle 401 Unauthorized (Token expired)
      if (response.status === 401) {
        // Clear token and user info
        this.logout();
        graphqlClient.logout();
        
        // Redirect to login page (only on client side)
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (!currentPath.startsWith('/auth/')) {
            window.location.href = '/auth/login';
          }
        }
        
        throw new Error('Session expired. Please login again.');
      }
      
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Auth methods - now using GraphQL
  async login(email: string, password: string) {
    const result = await graphqlClient.login(email, password);
    return {
      access_token: result.token,
      user: result.user,
    };
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role?: 'admin' | 'owner' | 'user';
  }) {
    const result = await graphqlClient.createUser({
      email: data.email,
      password: data.password,
      fullName: `${data.firstName} ${data.lastName}`,
      phoneNumber: data.phoneNumber || '',
      role: data.role,
    });
    return {
      success: result.success,
      message: result.message,
      user: result.user,
    };
  }

  logout() {
    this.setToken(null);
    graphqlClient.logout();
  }

  // User methods - now using GraphQL
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const users = await graphqlClient.getUsers();
    // Apply search filter if provided
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      return users.filter((user: any) =>
        user.email?.toLowerCase().includes(searchLower) ||
        user.fullName?.toLowerCase().includes(searchLower) ||
        user.phoneNumber?.includes(searchLower)
      );
    }
    return users;
  }

  async getUser(id: string) {
    const users = await graphqlClient.getUsers();
    return users.find((user: any) => user.id === id);
  }

  async deleteUser(id: string) {
    // GraphQL mutation for delete user would need to be added to backend
    // For now, this is a placeholder
    throw new Error('Delete user mutation not yet implemented in GraphQL');
  }

  // Property methods - now using GraphQL
  async getProperties(params?: {
    city?: string;
    country?: string;
    propertyType?: string;
    search?: string;
  }) {
    return graphqlClient.getProperties(params);
  }

  async getProperty(id: string) {
    return graphqlClient.getProperty(id);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

