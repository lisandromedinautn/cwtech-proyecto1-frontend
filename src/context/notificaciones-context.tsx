import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export interface NotificacionApp {
  id: string;
  title: string;
  message: string;
  createdAt: number;
  type?: "warning" | "info" | "success";
}

interface NotificacionesContextValue {
  notificaciones: NotificacionApp[];
  agregarNotificacion: (notificacion: Omit<NotificacionApp, "createdAt">) => void;
  quitarNotificacion: (id: string) => void;
  limpiarNotificaciones: () => void;
}

const NotificacionesContext = createContext<NotificacionesContextValue | undefined>(undefined);

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<NotificacionApp[]>([]);

  const value = useMemo(
    () => ({
      notificaciones,
      agregarNotificacion: (notificacion: Omit<NotificacionApp, "createdAt">) => {
        setNotificaciones((actuales) => {
          if (actuales.some((actual) => actual.id === notificacion.id)) return actuales;
          return [...actuales, { ...notificacion, createdAt: Date.now() }];
        });
      },
      quitarNotificacion: (id: string) => {
        setNotificaciones((actuales) => actuales.filter((notificacion) => notificacion.id !== id));
      },
      limpiarNotificaciones: () => setNotificaciones([]),
    }),
    [notificaciones],
  );

  return <NotificacionesContext.Provider value={value}>{children}</NotificacionesContext.Provider>;
}

export function useNotificaciones() {
  const context = useContext(NotificacionesContext);
  if (!context) {
    throw new Error("useNotificaciones debe utilizarse dentro de NotificacionesProvider");
  }
  return context;
}