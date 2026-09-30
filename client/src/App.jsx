import { useRef } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import usePageAnimation from './hooks/usePageAnimation.js';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import SignIn from './pages/SignIn.jsx';
import Brands from './pages/Brands.jsx';
import Scan from './pages/Scan.jsx';
import Cart from './pages/Cart.jsx';
import Success from './pages/Success.jsx';
import Orders from './pages/Orders.jsx';
import StaffRoute from './components/StaffRoute.jsx';
import StaffLogin from './pages/staff/StaffLogin.jsx';
import Guard from './pages/staff/Guard.jsx';
import Admin from './pages/staff/Admin.jsx';

export default function App() {
  const location = useLocation();
  const pageRef = useRef(null);
  usePageAnimation(pageRef, location.pathname);

  return (
    <div ref={pageRef} className="min-h-screen bg-background text-foreground font-sans">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route
          path="/brands"
          element={
            <ProtectedRoute>
              <Brands />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scan"
          element={
            <ProtectedRoute>
              <Scan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/success/:orderId"
          element={
            <ProtectedRoute>
              <Success />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route path="/staff" element={<StaffLogin />} />
        <Route
          path="/guard"
          element={
            <StaffRoute roles={['guard', 'admin']}>
              <Guard />
            </StaffRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <StaffRoute roles={['admin']}>
              <Admin />
            </StaffRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
