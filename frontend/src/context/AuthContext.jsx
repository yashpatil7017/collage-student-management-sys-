import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth State from LocalStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify session validity with backend /me profile
          const response = await api.get('/auth/me');
          if (response.data && response.data.success) {
            const freshUser = response.data.data;
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        } catch (error) {
          console.error('Session initialization failed, clearing state:', error.message);
          // Token is invalid or expired
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data && response.data.success) {
        const { token: userToken, ...userData } = response.data.data;
        
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setToken(userToken);
        setUser(userData);
        return { success: true, message: response.data.message || 'Logged in successfully' };
      }
      return { success: false, message: 'Invalid response payload structure' };
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (fullName, email, password, role) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        fullName,
        email,
        password,
        role,
      });

      if (response.data && response.data.success) {
        const { token: userToken, ...userData } = response.data.data;
        
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setToken(userToken);
        setUser(userData);
        return { success: true, message: response.data.message || 'Registered successfully' };
      }
      return { success: false, message: 'Invalid registration response' };
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Registration failed. Please check inputs.';
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAdmin: user?.role === 'ADMIN',
        isTeacher: user?.role === 'TEACHER',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
