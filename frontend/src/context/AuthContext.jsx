import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api'; // Your API service

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Check initial auth status

  useEffect(() => {
    // Check if user info is in localStorage on initial load
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      const userInfo = JSON.parse(storedUserInfo);
      setUser(userInfo);
      // Optional: Verify token with backend here for robustness
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      return data; // Return user data on success
    } catch (error) {
      console.error("Login Error:", error.response ? error.response.data : error.message);
      // Throw the error so the calling component can handle it (e.g., show message)
      throw error.response ? error.response.data : new Error('Login failed');
    }
  };

  const register = async (name, email, password, role, location) => {
     try {
         const { data } = await api.post('/auth/register', { name, email, password, role, location });
         localStorage.setItem('userInfo', JSON.stringify(data));
         setUser(data);
         return data;
     } catch (error) {
         console.error("Registration Error:", error.response ? error.response.data : error.message);
         throw error.response ? error.response.data : new Error('Registration failed');
     }
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    // Optionally notify backend or perform other cleanup
  };

  // Function to update user info (e.g., after profile update)
  const updateUserContext = (newUserInfo) => {
      // Ensure token is preserved if the update response doesn't include it
      const updatedData = { ...user, ...newUserInfo };
      localStorage.setItem('userInfo', JSON.stringify(updatedData));
      setUser(updatedData);
  }

  return (
    <AuthContext.Provider value={{ user, setUser: updateUserContext, login, register, logout, loading }}>
      {!loading && children} {/* Render children only after initial loading check */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);