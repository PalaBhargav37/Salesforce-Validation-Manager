import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [instanceUrl, setInstanceUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setInstanceUrl(data.instance_url);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    // Check for login/error params in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      checkAuth();
    }
  }, [checkAuth]);

  const logout = async () => {
    await api.logout();
    setUser(null);
    setInstanceUrl(null);
  };

  return (
    <AuthContext.Provider value={{ user, instanceUrl, loading, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
