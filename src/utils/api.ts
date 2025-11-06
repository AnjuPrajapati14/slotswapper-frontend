import axios from 'axios';
import type { AuthResponse, Event, SwapRequest, CreateEventData, CreateSwapRequestData, SwapResponseData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: { name: string; email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
};

// Events API
export const eventsAPI = {
  getEvents: async (): Promise<{ events: Event[] }> => {
    const response = await api.get('/events');
    return response.data;
  },

  createEvent: async (data: CreateEventData): Promise<{ event: Event; message: string }> => {
    const response = await api.post('/events', data);
    return response.data;
  },

  updateEvent: async (eventId: string, data: CreateEventData): Promise<{ event: Event; message: string }> => {
    const response = await api.put(`/events/${eventId}`, data);
    return response.data;
  },

  updateEventStatus: async (eventId: string, status: string): Promise<{ event: Event; message: string }> => {
    const response = await api.patch(`/events/${eventId}/status`, { status });
    return response.data;
  },

  deleteEvent: async (eventId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  },
};

// Swaps API
export const swapsAPI = {
  getSwappableSlots: async (): Promise<{ slots: Event[] }> => {
    const response = await api.get('/swappable-slots');
    return response.data;
  },

  createSwapRequest: async (data: CreateSwapRequestData): Promise<{ swapRequest: SwapRequest; message: string }> => {
    const response = await api.post('/swap-request', data);
    return response.data;
  },

  respondToSwapRequest: async (requestId: string, data: SwapResponseData): Promise<{ swapRequest: SwapRequest; message: string }> => {
    const response = await api.post(`/swap-response/${requestId}`, data);
    return response.data;
  },

  getIncomingRequests: async (): Promise<{ requests: SwapRequest[] }> => {
    const response = await api.get('/incoming');
    return response.data;
  },

  getOutgoingRequests: async (): Promise<{ requests: SwapRequest[] }> => {
    const response = await api.get('/outgoing');
    return response.data;
  },
};

export default api;