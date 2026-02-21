import { Navigate, Outlet } from "react-router-dom";
import { useAppStore } from "@/store/appStore";

/** Renders children (Layout + nested routes) only when user is logged in; else redirects to /login */
export const ProtectedRoute = () => {
  const { user } = useAppStore();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};
