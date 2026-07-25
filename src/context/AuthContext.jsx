import React, { createContext, useState, useEffect } from 'react';
import { gasApi } from '../api/gasApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if a user is already logged in when the app loads
  useEffect(() => {
    const savedUser = localStorage.getItem('beed_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email) => {
    try {
      // We use the existing getStaffProfile API to verify the email exists in your Google Sheet
      const profile = await gasApi('getStaffProfile', { email });
      setCurrentUser(profile);
      localStorage.setItem('beed_user', JSON.stringify(profile));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('beed_user');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};