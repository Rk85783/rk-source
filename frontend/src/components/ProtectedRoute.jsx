import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export const ProtectedRoute = ({ children }) => {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center text-slate-500">
        <p>Checking your session...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};
