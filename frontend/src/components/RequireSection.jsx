import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { canAccess } from "../lib/access";

/**
 * Hiding a sidebar link is not access control. The API refuses a request the
 * user is not entitled to, but the page would still render and sit there
 * showing errors, so the route itself is guarded as well.
 */
export const RequireSection = ({ section, children }) => {
  const { user } = useAuth();

  if (!canAccess(user, section)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
