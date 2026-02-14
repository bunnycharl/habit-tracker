/**
 * API Client for Habit Tracker
 * Handles all communication with backend
 */

const API_BASE = '/api';

class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

async function request(endpoint, options = {}) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      window.dispatchEvent(new Event('auth-logout'));
      throw new APIError('Authorization required', 401);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(data.error?.message || 'API request failed', response.status);
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Network error: ' + error.message, 0);
  }
}

export const AuthAPI = {
  async login(username, pin) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, pin })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new APIError(data.error || 'Login failed', response.status);
    }
    return data;
  }
};

export const HabitAPI = {
  /**
   * Get all habits
   */
  async getAll() {
    return await request('/habits');
  },

  /**
   * Get all habits with stats
   */
  async getAllWithStats() {
    return await request('/habits/stats');
  },

  /**
   * Get habit by ID
   */
  async getById(id) {
    return await request(`/habits/${id}`);
  },

  /**
   * Create new habit
   */
  async create(data) {
    return await request('/habits', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Update habit
   */
  async update(id, data) {
    return await request(`/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * Delete (archive) habit
   */
  async delete(id) {
    return await request(`/habits/${id}`, {
      method: 'DELETE'
    });
  }
};

export const ExecutionAPI = {
  /**
   * Get executions with filters
   */
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    const query = params.toString();
    return await request(`/executions${query ? '?' + query : ''}`);
  },

  /**
   * Get today's executions
   */
  async getToday() {
    return await request('/executions/today');
  },

  /**
   * Get habits with today's status
   */
  async getHabitsStatus() {
    return await request('/executions/habits-status');
  },

  /**
   * Create execution
   */
  async create(data) {
    return await request('/executions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Toggle execution (create or delete)
   */
  async toggle(habitId, date = null) {
    const data = { habit_id: habitId };
    if (date) data.date = date;

    return await request('/executions/toggle', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Delete execution
   */
  async delete(habitId, date) {
    return await request(`/executions/${habitId}/${date}`, {
      method: 'DELETE'
    });
  }
};

export const AnalyticsAPI = {
  /**
   * Get overview statistics
   */
  async getOverview() {
    return await request('/analytics/overview');
  },

  /**
   * Get habit statistics
   */
  async getHabitStats(habitId) {
    return await request(`/analytics/habits/${habitId}/stats`);
  },

  /**
   * Get habit streak
   */
  async getStreak(habitId) {
    return await request(`/analytics/habits/${habitId}/streak`);
  },

  /**
   * Get all streaks
   */
  async getAllStreaks() {
    return await request('/analytics/streaks');
  },

  /**
   * Get heatmap data
   */
  async getHeatmap(year = new Date().getFullYear()) {
    return await request(`/analytics/heatmap?year=${year}`);
  },

  /**
   * Get weekly chart data
   */
  async getWeeklyChart() {
    return await request('/analytics/weekly-chart');
  }
};

export { APIError };
