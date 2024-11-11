// config/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

let api_url = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const api = axios.create({
  baseURL: api_url,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function setupAxiosInterceptors(setIsAuthenticated: (auth: boolean) => void) {
  api.interceptors.request.use(
    async (config) => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response && error.response.status === 401) {
        // Limpa o token inválido e atualiza o estado de autenticação
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        setIsAuthenticated(false); // Define isAuthenticated como falso

        // Você pode adicionar aqui alguma notificação ou log
      }
      return Promise.reject(error);
    }
  );
}

export default api;
