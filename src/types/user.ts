export interface User {
    user_id: number;
    username: string;
    email: string;
    password_hash?: string;
    full_name: string;
    phone_number: string;
    registration_date: string;
    last_login: string;
    preferences?: Record<string, unknown>;
    loyalty_points: number;
    status?: 'active' | 'inactive' | 'suspended';
  }
  
  export interface UsersResponse {
    users: User[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }
  
  export interface SearchFilters {
    query: string;
    status: string;
    minLoyaltyPoints: number;
    dateRange: {
      from: string;
      to: string;
    };
  }