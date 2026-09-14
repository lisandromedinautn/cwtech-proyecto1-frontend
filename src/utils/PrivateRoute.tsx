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

  // Caso 1: no hay token -> nunca se intenta decodificar
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Único decode, protegido contra token corrupto/mal formado
  let decodedToken: DecodedToken | null = null;
  try {
    decodedToken = jwtDecode<DecodedToken>(token);
  } catch {
    decodedToken = null;
  }

  // Caso 2: token corrupto o sin roles válidos -> falla controlada
  if (!decodedToken || !Array.isArray(decodedToken.roles)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasPermission = decodedToken.roles.some(role =>
    allowedRoles.includes(role)
  );

  // Caso 3: token válido pero sin permiso -> redirige (Opción A)
  if (!hasPermission) {
    return <Navigate to="/admin" replace />;
  }

  // Caso 4: token válido y con permiso -> deja pasar
  return <Outlet />;
};

export default PrivateRoute;