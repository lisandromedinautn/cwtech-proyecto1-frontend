import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Auditoria } from "../../../interfaces/generales/interfaces-generales";
import { getRoles } from "../../../utils/auth";
import InformacionAuditoria from "./informacion-auditoria";

vi.mock("../../../utils/auth", () => ({ getRoles: vi.fn(() => [1]) }));

const auditoria = (datos: Partial<Auditoria> = {}): Auditoria => ({
  id: 1,
  detalle: "Producto ACEITE GIRASOL 1.5L",
  createdAt: "23/09/2026 01:40",
  updatedAt: "23/09/2026 01:40",
  deletedAt: "",
  usuarioCreated: "Admin",
  usuarioUpdated: "",
  usuarioDeleted: "",
  ...datos,
});

describe("InformacionAuditoria", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("sin modificaciones muestra solo la creación, aunque updatedAt venga igual a createdAt", () => {
    render(<InformacionAuditoria auditoria={auditoria()} />);

    expect(screen.getByText("Creado")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.queryByText("Última modificación")).not.toBeInTheDocument();
    expect(screen.getByText("Este registro no ha sido modificado desde su creación")).toBeInTheDocument();
  });

  it("muestra la última modificación con su fecha y responsable", () => {
    render(
      <InformacionAuditoria
        auditoria={auditoria({ updatedAt: "24/09/2026 00:05", usuarioUpdated: "Jenifer Lopez" })}
      />,
    );

    expect(screen.getByText("Última modificación")).toBeInTheDocument();
    expect(screen.getByText("24/09/2026 00:05")).toBeInTheDocument();
    expect(screen.getByText("Jenifer Lopez")).toBeInTheDocument();
    expect(screen.queryByText("Este registro no ha sido modificado desde su creación")).not.toBeInTheDocument();
  });

  it("muestra el ID del registro solo a Root, sin pedir el rol al backend", () => {
    vi.mocked(getRoles).mockReturnValue([5]);
    render(<InformacionAuditoria auditoria={auditoria({ id: 42 })} />);
    expect(screen.getByText("42")).toBeInTheDocument();

    cleanup();
    vi.mocked(getRoles).mockReturnValue([1, 4]);
    render(<InformacionAuditoria auditoria={auditoria({ id: 42 })} />);
    expect(screen.queryByText("ID del Registro:")).not.toBeInTheDocument();
  });
});
