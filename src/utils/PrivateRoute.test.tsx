import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { jwtDecode } from "jwt-decode";
import PrivateRoute from "./PrivateRoute";

// Mock determinista de jwtDecode: decodifica un payload base64url concreto o
// lanza para tokens corruptos, imitando el comportamiento del paquete real.
vi.mock("jwt-decode", () => {
  const jwtDecode = vi.fn((token: string) => {
    const payload = token.split(".")[1];
    if (!payload) throw new TypeError("InvalidTokenError");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  });
  return { jwtDecode };
});

const crearToken = (payload: Record<string, unknown>): string => {
  const enc = (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${enc({ alg: "HS256", typ: "JWT" })}.${enc(payload)}.firma`;
};

const USUARIO_ADMIN = crearToken({ sub: 1, roles: [1, 3] });
const USUARIO_SIN_PERMISO = crearToken({ sub: 9, roles: [99] });

const renderConRuta = () =>
  render(
    <MemoryRouter initialEntries={["/admin/producto"]}>
      <Routes>
        <Route path="/login" element={<div>Página de Login</div>} />
        <Route element={<PrivateRoute allowedRoles={[1, 3]} />}>
          <Route path="/admin/producto" element={<div>Panel de Productos</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe("PrivateRoute (SYS-010): guardia de rutas", () => {
  afterEach(() => {
    cleanup();
    localStorage.removeItem("Token");
    vi.clearAllMocks();
  });

  it("sin token redirige a /login y NO intenta decodificar", () => {
    localStorage.removeItem("Token");
    renderConRuta();

    expect(screen.getByText("Página de Login")).toBeInTheDocument();
    expect(screen.queryByText("Panel de Productos")).not.toBeInTheDocument();
    expect(jwtDecode).not.toHaveBeenCalled();
  });

  it("con token válido y rol permitido resuelve la sesión y accede al contenido", () => {
    localStorage.setItem("Token", USUARIO_ADMIN);
    renderConRuta();

    expect(screen.getByText("Panel de Productos")).toBeInTheDocument();
    expect(screen.queryByText("Página de Login")).not.toBeInTheDocument();
  });

  it("con token corrupto falla de manera controlada y redirige a /login", () => {
    localStorage.setItem("Token", "corrupto.no.es.jwt");
    renderConRuta();

    expect(screen.getByText("Página de Login")).toBeInTheDocument();
    expect(screen.queryByText("Panel de Productos")).not.toBeInTheDocument();
  });

  it("con token válido pero rol no permitido muestra la alerta controlada y no accede", async () => {
    localStorage.setItem("Token", USUARIO_SIN_PERMISO);
    renderConRuta();

    expect(
      await screen.findByText("No tienes permiso para acceder a esta sección."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Panel de Productos")).not.toBeInTheDocument();
  });
});