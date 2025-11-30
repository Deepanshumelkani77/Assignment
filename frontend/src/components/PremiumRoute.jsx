import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const PremiumRoute = ({ children }) => {
  const { user, profile, loading } = useAppContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  if (!profile?.is_premium) {
    return <Navigate to="/upgrade" replace />;
  }

  return children;
};

export default PremiumRoute;
