import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  AUTH_EXPIRED_EVENT,
  hasStoredSession,
} from '../api/tokenStorage';

export default function RequireAuth() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(hasStoredSession);

  useEffect(() => {
    const handleAuthExpired = () => setIsAuthenticated(false);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
