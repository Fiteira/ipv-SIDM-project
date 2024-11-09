import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configura a URL base da API
let api_url = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: api_url,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configura um interceptor para incluir o token nas requisições
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;