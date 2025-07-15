const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('taskflow_token');
    }
    return null;
  }

  // Set auth token in localStorage
  setAuthToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('taskflow_token', token);
    }
  }

  // Remove auth token from localStorage
  removeAuthToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('taskflow_token');
    }
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Auth API methods
  async register(userData) {
    const response = await this.post('/auth/register', userData);
    if (response.token) {
      this.setAuthToken(response.token);
    }
    return response;
  }

  async login(credentials) {
    const response = await this.post('/auth/login', credentials);
    if (response.token) {
      this.setAuthToken(response.token);
    }
    return response;
  }

  async logout() {
    this.removeAuthToken();
    return { message: 'Logged out successfully' };
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  async updateProfile(userData) {
    return this.put('/auth/profile', userData);
  }

  async changePassword(passwordData) {
    return this.post('/auth/change-password', passwordData);
  }

  // Task API methods
  async getTasks(filters = {}) {
    return this.get('/tasks', filters);
  }

  async getTask(taskId) {
    return this.get(`/tasks/${taskId}`);
  }

  async createTask(taskData) {
    return this.post('/tasks', taskData);
  }

  async updateTask(taskId, taskData) {
    return this.put(`/tasks/${taskId}`, taskData);
  }

  async deleteTask(taskId) {
    return this.delete(`/tasks/${taskId}`);
  }

  async updateTaskStatus(taskId, status) {
    return this.patch(`/tasks/${taskId}/status`, { status });
  }

  async getTaskStats() {
    return this.get('/tasks/stats/overview');
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;