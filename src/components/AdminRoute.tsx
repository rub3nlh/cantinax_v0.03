import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const location = useLocation();
  const { user, session, initialized: authInitialized } = useAuth();
  const { isAdmin, loading: adminLoading, error, initialized: adminInitialized } = useAdmin();
  const [canAccess, setCanAccess] = useState<boolean | null>(null);

  useEffect(() => {
    // Only update access state when both auth and admin checks are complete
    if (authInitialized && adminInitialized) {
      const hasAccess = !!(user && session && isAdmin);
      setCanAccess(hasAccess);
      
      // Log state changes
      console.log('🔒 Admin access state:', {
        hasAuth: !!(user && session),
        isAdmin,
        hasAccess,
        authInitialized,
        adminInitialized
      });
    }
  }, [user, session, isAdmin, authInitialized, adminInitialized]);

  // Show loading state while checking access
  if (canAccess === null || !authInitialized || !adminInitialized || adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">
            {!authInitialized 
              ? 'Inicializando autenticación...' 
              : !adminInitialized 
                ? 'Verificando permisos...'
                : 'Cargando...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Handle access denied
  if (!canAccess) {
    // If not authenticated, redirect to login
    if (!user || !session) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    // If authenticated but not admin, redirect to home
    return <Navigate to="/" replace />;
  }

  // Render children if access is granted
  return <>{children}</>;
};