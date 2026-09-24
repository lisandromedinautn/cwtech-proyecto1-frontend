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
  const { showConfirmation, AlertasConfirmacion: AlertasConfirmacion } = useConfirmation();

  // La sesión se resuelve UNA sola vez y de forma consistente.
  // - Sin token: jamás se intenta decodificar (evita crasheo con jwtDecode(null)).
  // - Token corrupto/expirado: decodificación falla y se trata como sin sesión.
  let sesionValida = false;
  let hasPermission = false;

  if (token) {
    try {
      const decodedToken: DecodedToken = jwtDecode<DecodedToken>(token);
      const userRoles = decodedToken.roles;
      sesionValida = Array.isArray(userRoles);
      hasPermission =
        sesionValida &&
        userRoles.some((role) => allowedRoles.includes(role));
    } catch {
      sesionValida = false;
    }
  }

  // Solo avisa por falta de permiso cuando la sesión es válida pero el rol no alcanza.
  const denied = Boolean(token) && sesionValida && !hasPermission;

  React.useEffect(() => {
    if (!denied) return;
    const handleConfirmation = async () => {
      const confirmed = await showConfirmation({
        type: TipoAlertaConfirmacion.WARNING_ERROR,
        title: TituloAlertaConfirmacion.WARNING_ERROR,
        message: "No tienes permiso para acceder a esta sección.",
        confirmText: "Aceptar",
        cancelText: "Cancelar",
        onConfirm: () => {},
      });
      if (confirmed) {
        window.location.href = "/admin";
      }
    };
    handleConfirmation();
  }, [denied]);

  // Sin sesión: el acceso a rutas privadas falla de manera controlada.
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!sesionValida) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (hasPermission) {
    return <Outlet />;
  }

  return (
    <>
      <AlertasConfirmacion />
    </>
  );
};

export default PrivateRoute;