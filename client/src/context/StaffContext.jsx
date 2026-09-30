import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';

const Ctx = createContext(null);
export function StaffProvider({ children }) {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/staff/me').then((r) => setStaff(r.data.staff)).catch(() => setStaff(null)).finally(() => setLoading(false));
  }, []);
  const login = async (username, password) => {
    const r = await api.post('/staff/login', { username, password });
    setStaff(r.data.staff);
    return r.data.staff;
  };
  const logout = async () => { await api.post('/staff/logout'); setStaff(null); };
  return <Ctx.Provider value={{ staff, loading, login, logout }}>{children}</Ctx.Provider>;
}
export const useStaff = () => useContext(Ctx);
