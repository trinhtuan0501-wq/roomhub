import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// On Web, we can connect to localhost:5000. 
// On Android emulator, localhost refers to the emulator itself, so we must use 10.0.2.2.
// On physical devices, it should be the host machine's IP address.
// We'll set a default base URL but allow configuration.
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Access Token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Failed to retrieve access token from storage:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 (Unauthorized) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call backend token refresh endpoint
        // Use standard axios to avoid recursive interceptor calling
        const refreshResponse = await axios.post(`${getBaseUrl()}/auth/refresh-token`, {
          token: refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;

        // Save new tokens
        await AsyncStorage.setItem('accessToken', newAccessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);

        // Update Authorization header and retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.warn('Session expired. Redirecting to login...');
        
        // Clear auth tokens
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        
        // Trigger global logout callback or event
        if (typeof window !== 'undefined') {
          // On Web, dispatch event to alert Zustand store
          window.dispatchEvent(new Event('auth-logout'));
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { getBaseUrl };
