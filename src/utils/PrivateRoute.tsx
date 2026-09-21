import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

interface PrivateRouteProps {
  allowedRoles: number[];
}

interface DecodedToken {
  sub: number;
  roles: number[];
  empresaId: number;
  puntoVentaId: number;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
  const token = localStorage.getItem("Token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  let decodedToken: DecodedToken | null = null;
  try {
    decodedToken = jwtDecode<DecodedToken>(token);
  } catch {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!decodedToken || !Array.isArray(decodedToken.roles)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasPermission = decodedToken.roles.some(role =>
    allowedRoles.includes(role)
  );

  if (!hasPermission) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
