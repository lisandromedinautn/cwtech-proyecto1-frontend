import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Superlinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";
import { DatosCards } from "./datos-card";

const superlineaNormal: Superlinea = {
  id: 5,
  denominacion: "bebidas",
  observacion: "Bebidas en general",
  createdAt: null,
  updatedAt: null,
  deletedAt: null,
  usuarioCreatedId: 1,
  usuarioDeletedId: undefined,
  usuarioUpdatedId: undefined,
  sistema: 0,
};

const superlineaSistema: Superlinea = {
  ...superlineaNormal,
  id: 99,
  denominacion: "sin clasificar",
  sistema: 1,
};

const superlineaEliminada: Superlinea = {
  ...superlineaNormal,
  id: 7,
  deletedAt: "2026-09-15T10:00:00.000Z",
};

const handlers = () => ({
  onEditar: vi.fn(),
  onInfo: vi.fn(),
  onDelete: vi.fn(),
});

describe("DatosCards de SuperLínea", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("muestra la denominación y la observación", () => {
    render(<DatosCards superlinea={superlineaNormal} {...handlers()} />);

    expect(screen.getByText("bebidas")).toBeInTheDocument();
    expect(screen.getByText("Bebidas en general")).toBeInTheDocument();
  });

  it("permite editar, ver info y eliminar una SuperLínea normal", async () => {
    const user = userEvent.setup();
    const { onEditar, onInfo, onDelete } = handlers();

    render(
      <DatosCards
        superlinea={superlineaNormal}
        onEditar={onEditar}
        onInfo={onInfo}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByTitle("Editar"));
    await user.click(screen.getByTitle("Ver información"));
    await user.click(screen.getByTitle("Eliminar"));

    expect(onEditar).toHaveBeenCalledWith(5);
    expect(onInfo).toHaveBeenCalledWith(5);
    expect(onDelete).toHaveBeenCalledWith(5);
  });

  it("no ofrece editar ni eliminar si la SuperLínea es de sistema", () => {
    render(<DatosCards superlinea={superlineaSistema} {...handlers()} />);

    expect(screen.getByTitle("Editar")).toBeDisabled();
    expect(screen.getByTitle("Eliminar")).toBeDisabled();
    // La info sí está disponible, para poder ver la auditoría de "Sin clasificar".
    expect(screen.getByTitle("Ver información")).toBeEnabled();
  });

  it("muestra el badge Sistema en la SuperLínea de sistema", () => {
    render(<DatosCards superlinea={superlineaSistema} {...handlers()} />);

    expect(screen.getByText("Sistema")).toBeInTheDocument();
  });

  it("no muestra acciones si la SuperLínea está eliminada", () => {
    render(<DatosCards superlinea={superlineaEliminada} {...handlers()} />);

    expect(screen.queryByTitle("Editar")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Eliminar")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Ver información")).not.toBeInTheDocument();
  });

  it("muestra la fecha de eliminación cuando corresponde", () => {
    render(<DatosCards superlinea={superlineaEliminada} {...handlers()} />);

    expect(screen.getByText(/Eliminada el/)).toBeInTheDocument();
  });
});