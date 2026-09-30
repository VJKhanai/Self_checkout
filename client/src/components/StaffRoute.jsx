import { Navigate } from 'react-router-dom';
import { useStaff } from '../context/StaffContext.jsx';
import Spinner from './Spinner.jsx';

export default function StaffRoute({ roles, children }) {
  const { staff, loading } = useStaff();
  if (loading) return <Spinner />;
  if (!staff) return <Navigate to="/staff" replace />;
  if (!roles.includes(staff.role)) return <Navigate to="/staff" replace />;
  return children;
}
