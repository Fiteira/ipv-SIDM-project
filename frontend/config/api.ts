import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupCache } from 'axios-cache-interceptor';
import { isNetworkAvailable } from './netinfo';
import { Alert } from 'react-native'; // Import Alert

// Base URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Set up caching
const api = setupCache(
  axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  }),
  {
    ttl: 15 * 60 * 1000, // 15 minutes
  }
);

// AsyncStorage key for the offline request queue
const REQUEST_QUEUE_KEY = 'offlineRequestQueue';

// Save failed requests to queue
const queueRequest = async (request: { method: string; url: string; data?: any }) => {
  const queue = JSON.parse((await AsyncStorage.getItem(REQUEST_QUEUE_KEY)) || '[]');
  queue.push(request);
  await AsyncStorage.setItem(REQUEST_QUEUE_KEY, JSON.stringify(queue));
};

// Retry queued requests
const retryQueuedRequests = async () => {
  const queue = JSON.parse((await AsyncStorage.getItem(REQUEST_QUEUE_KEY)) || '[]');
  if (queue.length === 0) return;

  console.log(`Retrying ${queue.length} queued requests...`);
  const remainingQueue = [];

  for (const request of queue) {
    try {
      await api({
        method: request.method,
        url: request.url,
        data: request.data,
      });
      console.log(`Request to ${request.url} succeeded.`);
    } catch (error) {
      console.error(`Request to ${request.url} failed again:`, error);
      remainingQueue.push(request);
    }
  }

  await AsyncStorage.setItem(REQUEST_QUEUE_KEY, JSON.stringify(remainingQueue));
};

// Monitor network status
const monitorNetworkStatus = () => {
  import('@react-native-community/netinfo').then((NetInfo) => {
    NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        retryQueuedRequests();
      }
    });
  });
};

// Set up Axios interceptors
export function setupAxiosInterceptors(setIsAuthenticated: (auth: boolean) => void) {
  monitorNetworkStatus();

  api.interceptors.request.use(
    async (config) => {
      const isConnected = await isNetworkAvailable();

      if (!isConnected) {
        console.warn('No internet connection. Using cached data if available.');
        config.cache = { interpretHeader: false }; // Use cache for offline requests
      } else {
        config.cache = false; // Disable cache when online
      }

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
      const originalRequest = error.config;

      // Handle offline errors
      if (error.message === 'Network Error' || !error.response) {
        console.warn('Network error. Saving request to queue.');
        await queueRequest({
          method: originalRequest.method,
          url: originalRequest.url.replace(API_URL, ''), // Use relative URL
          data: originalRequest.data,
        });
        return Promise.reject(new Error('Request queued due to network issues.'));
      }

      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        console.warn('Unauthorized. Clearing invalid token.');
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        setIsAuthenticated(false);

        Alert.alert('Session Expired', 'Your session has expired. Please log in again.');
      }

      return Promise.reject(error);
    }
  );
}

export default api;
