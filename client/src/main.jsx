import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { StoreProvider } from './context/StoreContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { StaffProvider } from './context/StaffContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <StaffProvider>
      <AuthProvider>
        <StoreProvider>
          <CartProvider>
            <App />
            <Toaster position="top-center" toastOptions={{ duration: 2500 }} />
          </CartProvider>
        </StoreProvider>
      </AuthProvider>
      </StaffProvider>
    </BrowserRouter>
  </React.StrictMode>
);
