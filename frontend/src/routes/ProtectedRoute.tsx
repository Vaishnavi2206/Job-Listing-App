import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import useAuth from "../hooks/useAuth";

const ProtectedRoute = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <p>Checking session...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
