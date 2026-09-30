import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api, { apiError } from '../api/client';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return setCart(null);
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setCart(data.cart);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(async (productId, brandId, qty = 1) => {
    const { data } = await api.post('/cart/items', { productId, brandId, qty });
    setCart(data.cart);
  }, []);

  const updateQty = useCallback(async (productId, qty) => {
    const { data } = await api.patch(`/cart/items/${productId}`, { qty });
    setCart(data.cart);
  }, []);

  const removeItem = useCallback(async (productId) => {
    const { data } = await api.delete(`/cart/items/${productId}`);
    setCart(data.cart);
  }, []);

  const clearCart = useCallback(async () => {
    await api.delete('/cart');
    setCart(null);
  }, []);

  const count = cart ? cart.items.reduce((s, i) => s + i.qty, 0) : 0;

  const value = useMemo(
    () => ({ cart, count, loading, refresh, addItem, updateQty, removeItem, clearCart, setCart }),
    [cart, count, loading, refresh, addItem, updateQty, removeItem, clearCart]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
