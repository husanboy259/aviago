import axios, { AxiosInstance, AxiosError } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

// Auth
export const authApi = {
  register:  (data: object) => api.post('/auth/register', data),
  login:     (email: string, password: string) => api.post('/auth/login', { email, password }),
  me:        ()             => api.get('/auth/me'),
  logout:    ()             => api.delete('/auth/logout'),
  refresh:   (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

// Restaurants
export const restaurantApi = {
  list:        (params?: object)                 => api.get('/restaurants', { params }),
  adminList:   ()                                => api.get('/restaurants/admin/all'),
  get:         (id: string)                      => api.get(`/restaurants/${id}`),
  create:      (data: object)                    => api.post('/restaurants', data),
  update:      (id: string, data: object)        => api.patch(`/restaurants/${id}`, data),
  toggle:      (id: string, isOpen: boolean)     => api.patch(`/restaurants/${id}/availability`, { isOpen }),
  approve:     (id: string, status: string)      => api.patch(`/restaurants/${id}/approve`, { status }),
  dashboard:   ()                                => api.get('/restaurants/my/dashboard'),
};

// Menu
export const menuApi = {
  list:        (restaurantId: string)            => api.get(`/restaurants/${restaurantId}/menu`),
  create:      (restaurantId: string, d: object) => api.post(`/restaurants/${restaurantId}/menu`, d),
  update:      (restaurantId: string, id: string, d: object) => api.patch(`/restaurants/${restaurantId}/menu/${id}`, d),
  toggle:      (restaurantId: string, id: string)            => api.patch(`/restaurants/${restaurantId}/menu/${id}/toggle`),
  remove:      (restaurantId: string, id: string)            => api.delete(`/restaurants/${restaurantId}/menu/${id}`),
};

// Orders
export const orderApi = {
  create:      (data: object)                    => api.post('/orders', data),
  myOrders:    (params?: object)                 => api.get('/orders/my', { params }),
  get:         (id: string)                      => api.get(`/orders/${id}`),
  updateStatus:(id: string, status: string, reason?: string) => api.patch(`/orders/${id}/status`, { status, reason }),
  assignDrone: (id: string, droneId: string)     => api.patch(`/orders/${id}/assign-drone`, { droneId }),
  restaurant:  (restaurantId: string)            => api.get(`/orders/restaurant/${restaurantId}`),
};

// Drones
export const droneApi = {
  list:        (params?: object)                 => api.get('/drones', { params }),
  available:   ()                                => api.get('/drones/available'),
  get:         (id: string)                      => api.get(`/drones/${id}`),
  create:      (data: object)                    => api.post('/drones', data),
  updateLoc:   (id: string, data: object)        => api.patch(`/drones/${id}/location`, data),
  updateStatus:(id: string, status: string)      => api.patch(`/drones/${id}/status`, { status }),
  assignRoute: (id: string, data: object)        => api.patch(`/drones/${id}/assign-route`, data),
  complete:    (id: string)                      => api.patch(`/drones/${id}/complete`),
};

// Addresses
export const addressApi = {
  list:        ()                                => api.get('/addresses'),
  create:      (data: object)                    => api.post('/addresses', data),
  update:      (id: string, data: object)        => api.patch(`/addresses/${id}`, data),
  setDefault:  (id: string)                      => api.patch(`/addresses/${id}/default`),
  remove:      (id: string)                      => api.delete(`/addresses/${id}`),
};

// Analytics
export const analyticsApi = {
  dashboard:   ()                                => api.get('/analytics/dashboard'),
  revenue:     (params?: object)                 => api.get('/analytics/revenue', { params }),
  trend:       (days?: number)                   => api.get('/analytics/trend', { params: { days } }),
  heatmap:     ()                                => api.get('/analytics/heatmap'),
  topRestaurants: (limit?: number)               => api.get('/analytics/top-restaurants', { params: { limit } }),
};
