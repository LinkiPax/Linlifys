import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/check');
        setCurrentUser(response.data.user);
      } catch (err) {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      setCurrentUser(response.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Login failed' };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      setCurrentUser(response.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Registration failed' };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setCurrentUser(null);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Logout failed' };
    }
  };

  // Update user function
  const updateUser = async (userData) => {
    try {
      const response = await axios.put('/api/auth/update', userData);
      setCurrentUser(response.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Update failed' };
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}