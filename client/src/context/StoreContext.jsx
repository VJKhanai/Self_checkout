import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const StoreContext = createContext(null);
const KEY = 'sc_active_brand';

export function StoreProvider({ children }) {
  const [brand, setBrand] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) || 'null');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (brand) sessionStorage.setItem(KEY, JSON.stringify(brand));
    else sessionStorage.removeItem(KEY);
  }, [brand]);

  const value = useMemo(() => ({ brand, setBrand }), [brand]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
