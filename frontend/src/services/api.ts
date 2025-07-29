// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; // Make sure this matches your FastAPI backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken'); // Assuming you store the token in localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const loginUser = async (email: string, password: string) => {
  const response = await api.post('/token', new URLSearchParams({ username: email, password: password }));
  return response.data; // { access_token: \"...\", token_type: \"bearer\" }
};

export const createUser = async (userData: { email: string; password: string; is_admin: boolean }) => {
  const response = await api.post('/users/', userData);
  return response.data;
};

export const fetchUsers = async () => {
  const response = await api.get('/users/'); // This endpoint requires admin
  return response.data;
};

export const fetchUserById = async (userId: string) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const updateUser = async (userId: string, userData: any) => {
  const response = await api.put(`/users/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId: string) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};

// Task API calls
export const createTask = async (taskData: any) => {
  const response = await api.post('/tasks/', taskData);
  return response.data;
};

export const fetchTasks = async () => {
  const response = await api.get('/tasks/');
  return response.data;
};

export const fetchTaskById = async (taskId: string) => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

export const updateTask = async (taskId: string, taskData: any) => {
  const response = await api.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

export const deleteTask = async (taskId: string) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};