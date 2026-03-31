import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ token: string; username: string }>('/auth/login', { username, password }),
  signup: (username: string, password: string) =>
    api.post<{ token: string; username: string }>('/auth/signup', { username, password }),
};

export const scoresApi = {
  submit: (score: number, kills: number, timeAlive: number) =>
    api.post('/scores', { score, kills, timeAlive }),
  getTop: () =>
    api.get<ScoreEntry[]>('/scores'),
};

export interface ScoreEntry {
  _id: string;
  username: string;
  score: number;
  kills: number;
  timeAlive: number;
  createdAt: string;
}
