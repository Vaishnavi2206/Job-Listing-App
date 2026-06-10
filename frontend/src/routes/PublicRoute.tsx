import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import useAuth from "../hooks/useAuth";

const PublicRoute = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
