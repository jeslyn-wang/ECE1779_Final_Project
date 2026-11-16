import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { LoadingState } from "../components/States.jsx";

/** Sends signed-out visitors to /login, then back here after they log in. */
export default function RequireAuth({ children }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <LoadingState />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}
