import axios from 'axios';
import { handleApiError } from './apiErrorHandler';

const api = axios.create({
  // baseURL: import.meta.env.VITE_API_URL || 'http://localhost:7149/api',
  baseURL: 'https://localhost:7149/api',
  // timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
   validateStatus: (status) => {
    console.log(status)
    return status >= 200 && status < 300; // qualquer coisa fora de 2xx vai para o catch
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }

    handleApiError(error.response?.data);

    return Promise.reject(error);
  }
);

export default api;
