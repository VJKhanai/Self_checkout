import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { apiError } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const sendOtp = useCallback(async (name, phone) => {
    const { data } = await api.post('/auth/send-otp', { name, phone });
    return data;
  }, []);

  const verifyOtp = useCallback(async (phone, code) => {
    const { data } = await api.post('/auth/verify-otp', { phone, code });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, sendOtp, verifyOtp, logout }), [user, loading, sendOtp, verifyOtp, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
export { apiError };
