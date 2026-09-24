import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Auditoria } from "../../../interfaces/generales/interfaces-generales";
import InformacionAuditoria from "./informacion-auditoria";

vi.mock("../../gestion-usuario/usuario-service", () => ({
  default: { obtenerRol: vi.fn().mockResolvedValue({ data: { denominacion: "Administrador" } }) },
}));
vi.mock("../../../utils/auth", () => ({ getRoles: vi.fn(() => [1]) }));

const auditoria = (datos: Partial<Auditoria> = {}): Auditoria => ({
  id: 7,
  detalle: "Producto MARGARINA 500G",
  createdAt: "23/09/2026 01:40",
  updatedAt: "24/09/2026 10:30",
  deletedAt: "",
  usuarioCreated: "Admin",
  usuarioUpdated: "Jenifer Lopez",
  usuarioDeleted: "",
  ...datos,
});

describe("InformacionAuditoria de un registro eliminado", () => {
  afterEach(() => {
    cleanup();
  });

  it("reemplaza la actualización por quién lo eliminó y cuándo", () => {
    render(
      <InformacionAuditoria
        auditoria={auditoria({ deletedAt: "24/09/2026 10:30", usuarioDeleted: "Thomas Perez" })}
      />,
    );

    expect(screen.getByText("Eliminado")).toBeInTheDocument();
    expect(screen.getByText("Eliminado por")).toBeInTheDocument();
    expect(screen.getByText("Thomas Perez")).toBeInTheDocument();
    expect(screen.queryByText("Jenifer Lopez")).not.toBeInTheDocument();
  });

  it("un registro activo no muestra el bloque de eliminación", () => {
    render(<InformacionAuditoria auditoria={auditoria()} />);

    expect(screen.queryByText("Eliminado por")).not.toBeInTheDocument();
  });
});
