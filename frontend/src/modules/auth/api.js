import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('brightloop-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  forgot: (data) => api.post('/auth/forgot-password', data),
  reset: (data) => api.post('/auth/reset-password', data),
  me: () => api.get('/auth/me'),
};

export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/;
export const passwordRules = [
  ['length', 'At least 9 characters', (password) => password.length >= 9],
  ['upper', 'One uppercase letter', (password) => /[A-Z]/.test(password)],
  ['lower', 'One lowercase letter', (password) => /[a-z]/.test(password)],
  ['special', 'One special character', (password) => /[^A-Za-z0-9]/.test(password)],
];
