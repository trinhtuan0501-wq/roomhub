import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'tenant' | 'landlord' | 'admin';
  status: 'active' | 'unverified' | 'locked' | 'disabled';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<string>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Listen to session expiration events from Axios interceptor
  if (typeof window !== 'undefined') {
    window.addEventListener('auth-logout', () => {
      set({ user: null, isAuthenticated: false });
    });
  }

  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    clearError: () => set({ error: null }),

    // LOAD USER SESSION ON STARTUP
    loadUser: async () => {
      set({ isLoading: true, error: null });
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          set({ isLoading: false, isAuthenticated: false, user: null });
          return;
        }

        if (token === 'mock-access-token') {
          const activeUserStr = await AsyncStorage.getItem('activeMockUser');
          if (activeUserStr) {
            set({
              user: JSON.parse(activeUserStr),
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }
        }

        const response = await api.get('/auth/me');
        if (response.data?.user) {
          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({ isLoading: false, isAuthenticated: false, user: null });
        }
      } catch (err: any) {
        console.warn('Failed to load user session:', err.message);
        // Clean tokens if auth request failed (likely expired)
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('activeMockUser');
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    },

    // REGISTER
    register: async (data) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post('/auth/register', data);
        set({ isLoading: false });
        return response.data.message || 'Đăng ký thành công. Vui lòng xác thực email.';
      } catch (err: any) {
        if (!err.response) {
          console.log('Network error detected. Falling back to local mock database...');
          try {
            const localUsersStr = await AsyncStorage.getItem('localUsers');
            const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
            
            const userExists = localUsers.find((u: any) => u.email === data.email);
            if (userExists) {
              set({ isLoading: false, error: 'Email này đã được đăng ký' });
              throw new Error('Email này đã được đăng ký');
            }
            
            const newUser = {
              id: `mock-user-${Date.now()}`,
              fullName: data.fullName,
              email: data.email,
              phone: data.phone,
              role: data.role,
              status: 'active',
              password: data.password
            };
            
            localUsers.push(newUser);
            await AsyncStorage.setItem('localUsers', JSON.stringify(localUsers));
            
            set({ isLoading: false });
            return 'Đăng ký tài khoản thử nghiệm thành công! Bạn có thể đăng nhập ngay.';
          } catch (localErr: any) {
            set({ isLoading: false, error: localErr.message });
            throw localErr;
          }
        }
        const errMsg = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        set({ isLoading: false, error: errMsg });
        throw new Error(errMsg);
      }
    },

    // LOGIN
    login: async (credentials) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post('/auth/login', {
          ...credentials,
          deviceName: typeof window !== 'undefined' ? window.navigator.userAgent : 'Mobile App',
        });

        const { accessToken, refreshToken, user } = response.data;

        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (err: any) {
        if (!err.response) {
          console.log('Network error detected. Falling back to local mock authentication...');
          try {
            const localUsersStr = await AsyncStorage.getItem('localUsers');
            const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
            
            let matchedUser = localUsers.find(
              (u: any) => u.email === credentials.email && u.password === credentials.password
            );
            
            if (!matchedUser) {
              const isDefaultAdmin = credentials.email === 'admin@roomhub.vn' && credentials.password === 'Admin@123456';
              const isDefaultLandlord = credentials.email.startsWith('landlord') && 
                                        credentials.email.endsWith('@roomhub.vn') && 
                                        credentials.password === 'Landlord@123456';
              const isDefaultTenant = credentials.email.startsWith('tenant') && 
                                      credentials.email.endsWith('@roomhub.vn') && 
                                      credentials.password === 'Tenant@123456';
              
              if (isDefaultAdmin) {
                matchedUser = { id: 'admin-mock-id', fullName: 'RoomHub Administrator', email: credentials.email, phone: '0901234567', role: 'admin', status: 'active' };
              } else if (isDefaultLandlord) {
                const numStr = credentials.email.replace('landlord', '').replace('@roomhub.vn', '');
                matchedUser = { id: `landlord-mock-${numStr}`, fullName: `Chủ nhà Nguyễn Văn ${numStr}`, email: credentials.email, phone: '0922222222', role: 'landlord', status: 'active' };
              } else if (isDefaultTenant) {
                const numStr = credentials.email.replace('tenant', '').replace('@roomhub.vn', '');
                matchedUser = { id: `tenant-mock-${numStr}`, fullName: `Sinh viên Lê Thị ${numStr}`, email: credentials.email, phone: '0933333333', role: 'tenant', status: 'active' };
              }
            }
            
            if (matchedUser) {
              await AsyncStorage.setItem('accessToken', 'mock-access-token');
              await AsyncStorage.setItem('refreshToken', 'mock-refresh-token');
              await AsyncStorage.setItem('activeMockUser', JSON.stringify(matchedUser));
              
              set({
                user: matchedUser,
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            } else {
              const errMsg = 'Tài khoản hoặc mật khẩu không chính xác.';
              set({ isLoading: false, error: errMsg });
              throw new Error(errMsg);
            }
          } catch (localErr: any) {
            set({ isLoading: false, error: localErr.message });
            throw localErr;
          }
        }
        const errMsg = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
        set({ isLoading: false, error: errMsg });
        throw new Error(errMsg);
      }
    },

    // LOGOUT
    logout: async () => {
      set({ isLoading: true });
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken && refreshToken !== 'mock-refresh-token') {
          await api.post('/auth/logout', { token: refreshToken });
        }
      } catch (err) {
        console.warn('Logout request failed:', err);
      } finally {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('activeMockUser');
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    },
  };
});
