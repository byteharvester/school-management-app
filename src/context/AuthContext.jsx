// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { getUserRole } from '../api/endpoints';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserRole()
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setUser({ role: 'Blocked' });
        setLoading(false);
      });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

