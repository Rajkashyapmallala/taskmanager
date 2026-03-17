import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't attempt refresh for authentication endpoints to avoid redirecting during login/register flow
    const isAuthRequest = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register') || originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
};

// Tasks API
export const tasksApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/tasks', { params }),
  getOne: (id: string) =>
    api.get(`/tasks/${id}`),
  create: (data: object) =>
    api.post('/tasks', data),
  update: (id: string, data: object) =>
    api.patch(`/tasks/${id}`, data),
  delete: (id: string) =>
    api.delete(`/tasks/${id}`),
  toggle: (id: string) =>
    api.post(`/tasks/${id}/toggle`),
};
