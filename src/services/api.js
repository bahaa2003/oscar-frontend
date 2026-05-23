import axios from 'axios';
import { mockProducts } from '../data/mockData';
import { devLogger } from '../utils/devLogger';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com';
const AUTH_STORAGE_KEY = 'auth-storage';

const getStoredAuthToken = () => {
  if (typeof window === 'undefined' || !window.localStorage) return null;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return String(parsed?.state?.token || '').trim() || null;
  } catch {
    return null;
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

api.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  if (token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

// Mock adapter logic could be added here if we wanted to intercept requests
// For now, we'll just export a helper that tries to fetch but falls back to mock data
// if the API fails or is not configured.

export const fetchProducts = async () => {
  try {
    if (!import.meta.env.VITE_API_BASE_URL) throw new Error('No API URL');
    const response = await api.get('/products');
    return response.data;
  } catch (error) {
    devLogger.warnOnce('API fetch failed, using mock data:', error.message);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return mockProducts;
  }
};

export default api;
