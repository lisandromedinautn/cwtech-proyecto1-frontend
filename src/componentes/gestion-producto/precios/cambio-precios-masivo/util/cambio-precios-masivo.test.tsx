import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ctx = vi.hoisted(() => ({
  confirmar: true,
  valoresFiltros: {} as Record<string, unknown>,
  setValoresFiltros: (() => undefined) as (v: Record<string, unknown>) => void,
  buscarLineas: 0,
  lineas: [] as { id: number; denominacion: string }[],
  setLineas: (() => undefined) as (l: unknown[]) => void,
  caracteres: 4,
}));

vi.mock("../../../../herramientas/tablas/tabla-flexible-ag-grid", async () => ({
  TablaAGGrid: (await import("../../../../../test/mock-tabla")).TablaAGGridMock,
}));
vi.mock("react-select", () => ({
  default: ({ options, onChange, placeholder, isDisabled, getOptionLabel }: any) => (
    <div>
      <span>{placeholder}</span>
      {options.map((o: any) => (
        <button key={o.id} type="button" disabled={isDisabled} onClick={() => onChange(o)}>
          {getOptionLabel(o)}
        </button>
      ))}
      <button type="button" onClick={() => onChange(null)}>limpiar línea</button>
    </div>
  ),
}));
vi.mock("../../../../herramientas/alertas/alertas-confirmacion", () => ({
  TipoAlertaConfirmacion: { DEFAULT: "default", DESTRUCTIVE: "destructive" },
  TituloAlertaConfirmacion: { DEFAULT: "Confirmación", DESTRUCTIVE: "Eliminar" },
  useConfirmation: () => ({ showConfirmation: () => Promise.resolve(ctx.confirmar), AlertasConfirmacion: () => null }),
}));
vi.mock("../../../../../context/filtros-contesxt", () => ({
  useFiltrosContext: () => ({
    setFiltrosNecesarios: vi.fn(),
    valoresFiltros: ctx.valoresFiltros,
    setValoresFiltros: ctx.setValoresFiltros,
    limpiarFiltros: vi.fn(),
    setBuscar: vi.fn(),
    buscarLineas: ctx.buscarLineas,
  }),
}));
vi.mock("../../../../../context/catalogos-context", () => ({
  useCatalogosContext: () => ({ lineas: ctx.lineas, setLineas: ctx.setLineas }),
}));
vi.mock("../../../../sistema/ConfiguracionSistemaContext", () => ({
  useConfiguracionSistema: () => ({ configuracion: { caracteresParaBusqueda: ctx.caracteres } }),
}));
vi.mock("../../../../../utils/auth", () => ({ getUsuarioId: () => 7 }));
vi.mock("../cambio-precios-masivo-service", () => ({
  default: { aplicarCambios: vi.fn(), guardarCambios: vi.fn() },
}));
vi.mock("../../../producto/services/producto-service", () => ({
  default: { obtener: vi.fn(), obtenerTotales: vi.fn() },
}));
vi.mock("../cambio-precios.manual", () => ({ default: () => <div>manual mock</div> }));

import CambioPreciosMasivoService from "../cambio-precios-masivo-service";
import ProductoService from "../../../producto/services/producto-service";
import CambioPreciosMasivo from "./cambio-precios-masivo";

const producto = (id: number, precio = 100) => ({
  id,
  denominacion: `PRODUCTO ${id}`,
  codigoProveedor: `C${id}`,
  precio,
  observacion: id === 1 ? "una observación" : "",
  presentacion: { envase: { id: 1, denominacion: "BOTELLA" }, contenido: { cantidad: 500, unidad: "ml" }, texto: "BOTELLA 500 ml" },
});

const obtener = vi.mocked(ProductoService.obtener);
const preview = vi.mocked(CambioPreciosMasivoService.aplicarCambios);
const guardar = vi.mocked(CambioPreciosMasivoService.guardarCambios);

beforeEach(() => {
  ctx.confirmar = true;
  ctx.valoresFiltros = {};
  ctx.buscarLineas = 0;
  ctx.lineas = [{ id: 3, denominacion: "GASEOSAS" }];
  ctx.setValoresFiltros = vi.fn();
  ctx.setLineas = vi.fn();
  ctx.caracteres = 4;
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  obtener.mockResolvedValue({ data: [producto(1), producto(2, 250)], total: 2 } as never);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

const alcanceGlobal = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.selectOptions(screen.getByLabelText("Seleccioná el alcance de la modificación"), "GLOBAL");
  await screen.findByText("PRODUCTO 1");
};

const ingresarValor = async (user: ReturnType<typeof userEvent.setup>, valor: string) => {
  const input = screen.getByLabelText(/Porcentaje de ajuste|Monto de ajuste/);
  await user.clear(input);
  await user.type(input, valor);
};

describe("CambioPreciosMasivo: alcance y búsqueda", () => {
  it("al elegir alcance global carga todos los productos, con presentación y precio", async () => {
    const user = userEvent.setup();
    render(<CambioPreciosMasivo />);
    await alcanceGlobal(user);

    expect(obtener).toHaveBeenCalledWith({ lineaId: undefined, skip: 0, take: 10 });
    expect(screen.getAllByText("BOTELLA 500 ml")).toHaveLength(2);
    expect(screen.getByText("una observación")).toBeInTheDocument();
    expect(ctx.setValoresFiltros).toHaveBeenCalledWith({ denominacionLinea: "", lineaId: undefined });
  });

  it("sin alcance no se puede buscar ni previsualizar", () => {
    render(<CambioPreciosMasivo />);
    expect(screen.getByTitle("Buscar productos")).toBeDisabled();
    expect(screen.getByTitle("Previsualizar cambios")).toBeDisabled();
    expect(screen.getByTitle("Guardar cambios")).toBeDisabled();
    expect(screen.getByLabelText("Tipo de ajuste")).toBeDisabled();
  });

  it("alcance por línea: exige elegir una línea antes de buscar", async () => {
    const user = userEvent.setup();
    render(<CambioPreciosMasivo />);

    await user.selectOptions(screen.getByLabelText("Seleccioná el alcance de la modificación"), "LINEA");
    await user.click(screen.getByTitle("Buscar productos"));

    expect(await screen.findByText("Seleccioná una línea para buscar sus productos.")).toBeInTheDocument();
    expect(obtener).not.toHaveBeenCalled();
  });

  it("alcance por línea con línea elegida busca los productos de esa línea", async () => {
    const user = userEvent.setup();
    ctx.valoresFiltros = { lineaId: 3 };
    render(<CambioPreciosMasivo />);

    await user.selectOptions(screen.getByLabelText("Seleccioná el alcance de la modificación"), "LINEA");
    await user.click(screen.getByTitle("Buscar productos"));

    await waitFor(() => expect(obtener).toHaveBeenCalledWith({ lineaId: 3, skip: 0, take: 10 }));
  });

  it("elegir una línea y limpiarla actualiza los filtros", async () => {
    const user = userEvent.setup();
    render(<CambioPreciosMasivo />);
    await user.selectOptions(screen.getByLabelText("Seleccioná el alcance de la modificación"), "LINEA");

    await user.click(screen.getByText("GASEOSAS"));
    expect(ctx.setValoresFiltros).toHaveBeenCalledWith({ lineaId: 3 });
    await user.click(screen.getByText("limpiar línea"));
    expect(ctx.setValoresFiltros).toHaveBeenLastCalledWith({ lineaId: undefined });
  });

  it("volver a un alcance vacío o de línea limpia la tabla", async () => {
    const user = userEvent.setup();
    render(<CambioPreciosMasivo />);
    await alcanceGlobal(user);

    await user.selectOptions(screen.getByLabelText("Seleccioná el alcance de la modificación"), "LINEA");
    await waitFor(() => expect(screen.queryByText("PRODUCTO 1")).not.toBeInTheDocument());
  });

  it("Borrar restablece filtros, tabla, alcance y valor", async () => {
    const user = userEvent.setup();
    render(<CambioPreciosMasivo />);
    await alcanceGlobal(user);

    await user.click(screen.getByTitle("Limpiar filtros"));

    expect(ctx.setLineas).toHaveBeenCalledWith([]);
    expect(screen.getByLabelText("Seleccioná el alcance de la modificación")).toHaveValue("");
    await waitFor(() => expect(screen.queryByText("PRODUCTO 1")).not.toBeInTheDocument());
  });

  it("la búsqueda de líneas por texto respeta el mínimo de caracteres", async () => {
    ctx.valoresFiltros = { denominacionLinea: "ga" };
    render(<CambioPreciosMasivo />);
    await waitFor(() => expect(ProductoService.obtenerTotales).not.toHaveBeenCalled());
    cleanup();

    ctx.valoresFiltros = { denominacionLinea: "gaseosas" };
    vi.mocked(ProductoService.obtenerTotales).mockResolvedValue({ data: [{ id: 1, denominacion: "GASEOSAS" }] } as never);
    render(<CambioPreciosMasivo />);
    await waitFor(() => expect(ProductoService.obtenerTotales).toHaveBeenCalledWith({ denominacion: "gaseosas" }, "lineas"));
    expect(ctx.setLineas).toHaveBeenCalledWith([{ id: 1, denominacion: "GASEOSAS" }]);
  });

  it("Enter en el buscador de línea vuelve a buscar líneas", async () => {
    const user = userEvent.setup();
    ctx.valoresFiltros = { denominacionLinea: "gaseosas" };
    vi.mocked(ProductoService.obtenerTotales).mockResolvedValue({ data: [] } as never);
    render(<CambioPreciosMasivo />);
    await user.selectOptions(screen.getByLabelText("Seleccioná el alcance de la modificación"), "LINEA");
    await waitFor(() => expect(ProductoService.obtenerTotales).toHaveBeenCalledTimes(1));

    await user.type(screen.getByPlaceholderText("Denominación..."), "{Enter}");
    await waitFor(() => expect(ProductoService.obtenerTotales).toHaveBeenCalledTimes(2));
  });

  it("si falla la búsqueda de líneas muestra un error", async () => {
    ctx.valoresFiltros = { denominacionLinea: "gaseosas" };
    vi.mocked(ProductoService.obtenerTotales).mockRejectedValue(new Error("x"));
    render(<CambioPreciosMasivo />);
    expect(await screen.findByText("No se pudieron cargar las líneas.")).toBeInTheDocument();
  });

  it("pagina: pide el skip de la página elegida", async () => {
    const user = userEvent.setup();
    obtener.mockResolvedValue({ data: [producto(1)], total: 25 } as never);
    render(<CambioPreciosMasivo />);
    await alcanceGlobal(user);

    await user.click(screen.getByRole("button", { name: "2" }));

    await waitFor(() => expect(obtener).toHaveBeenLastCalledWith({ lineaId: undefined, skip: 10, take: 10 }));
  });
});

describe("CambioPreciosMasivo: previsualización", () => {
  it("valor 0: pide ingresar un valor distinto de 0", async () => {
    const user = userEvent.setup();
    render(<CambioPreciosMasivo />);
    await alcanceGlobal(user);

    await user.click(screen.getByTitle("Previsualizar cambios"));

    expect(await screen.findByText("Ingresá un porcentaje o monto distinto de 0.")).toBeInTheDocument();
    expect(preview).not.toHaveBeenCalled();
  });

  it("porcentaje: no acepta más de 100 en valor absoluto, pero sí el monto fijo", async () => {
    const user = userEvent.setup();
    render(<CambioPreciosMasivo />);
    await alcanceGlobal(user);

    await ingresarValor(user, "150");
    expect(screen.getByLabelText("Porcentaje de ajuste")).toHaveValue(15);
    await user.clear(screen.getByLabelText("Porcentaje de ajuste"));

    await user.selectOptions(screen.getByLabelText("Tipo de ajuste"), "2");
    await ingresarValor(user, "150");
    expect(screen.getByLabelText("Monto de ajuste")).toHaveValue(150);
  });

  it("previsualización válida: muestra precio anterior tachado y el nuevo, y habilita guardar", async () => {
    const user = userEvent.setup();
    preview.mockResolvedValue({
      items: [
        { productoId: 1, precioActual: 100, precioNuevo: 110, valido: true },
        { productoId: 2, precioActual: 250, precioNuevo: 275, valido: true },
      ],
      cantidadTotal: 2,
      cantidadInvalidos: 0,
    } as never);
    render(<CambioPreciosMasivo />);
    await alcanceGlobal(user);

    await ingresarValor(user, "10");
    await user.click(screen.getByTitle("Previsualizar cambios"));

    expect(await screen.findByText("Previsualización lista: 2 producto(s) serían afectados.")).toBeInTheDocument();
    expect(preview).toHaveBeenCalledWith({ tipo: 1, valor: 10, alcance: "GLOBAL", lineaId: undefined, usuarioId: 7 });
    expect(screen.getByText("$110,00")).toBeInTheDocument();
    expect(screen.getByTitle("Guardar cambios")).toBeEnabled();
  });

  it("con productos inválidos avisa y no habilita el guardado", async () => {
    const user = userEvent.setup();
    preview.mockResolvedValue({
      items: [
        { productoId: 1, precioActual: 100, precioNuevo: null, valido: false },
        { productoId: 2, precioActual: 250, precioNuevo: 275, valido: true },
      ],
      cantidadTotal: 2,
      cantidadInvalidos: 1,
    } as never);
    render(<CambioPreciosMasivo />);
    await alcanceGlobal(user);

    await ingresarValor(user, "-100");
    await user.click(screen.getByTitle("Previsualizar cambios"));

    expect(await screen.findByText(/1 de 2 producto\(s\) quedarían con precio inválido/)).toBeInTheDocument();
    expect(screen.getByText("inválido")).toBeInTheDocument();
    expect(screen.getByTitle("Guardar cambios")).toBeDisabled();
  });

  it("acepta un preview devuelto como arreglo plano", async () => {
    const user = userEvent.setup();
    preview.mockResolvedValue([
      { id: 1, precioActual: 100, precioNuevo: 120 },
      { id: 2, precioActual: 250, precioNuevo: null, valido: false },
    ] as never);
    render(<CambioPreciosMasivo />);
    await alcanceGlobal(user);

    await ingresarValor(user, "20");
    await user.click(screen.getByTitle("Previsualizar cambios"));

    expect(await screen.findByText(/1 de 2 producto\(s\) quedarían con precio inválido/)).toBeInTheDocument();
  });

  it("si el backend rechaza el preview muestra su mensaje o uno genérico", async () => {
    const user = userEvent.setup();
    preview.mockRejectedValueOnce({ response: { data: { message: "Porcentaje inválido" } } });
    render(<CambioPreciosMasivo />);
    await alcanceGlobal(user);

    await ingresarValor(user, "10");
    await user.click(screen.getByTitle("Previsualizar cambios"));
    expect(await screen.findByText("Porcentaje inválido")).toBeInTheDocument();

    preview.mockRejectedValueOnce(new Error("x"));
    await user.click(screen.getByTitle("Previsualizar cambios"));
    expect(await screen.findByText("No se pudo calcular la previsualización.")).toBeInTheDocument();
  });

  it("cambiar el valor o el tipo invalida la previsualización", async () => {
    const user = userEvent.setup();
    preview.mockResolvedValue({ items: [{ productoId: 1, precioActual: 100, precioNuevo: 110, valido: true }], cantidadTotal: 1, cantidadInvalidos: 0 } as never);
    render(<CambioPreciosMasivo />);
    await alcanceGlobal(user);
    await ingresarValor(user, "10");
    await user.click(screen.getByTitle("Previsualizar cambios"));
    await waitFor(() => expect(screen.getByTitle("Guardar cambios")).toBeEnabled());

    await user.clear(screen.getByLabelText("Porcentaje de ajuste"));
    expect(screen.getByTitle("Guardar cambios")).toBeDisabled();

    await ingresarValor(user, "10");
    await user.click(screen.getByTitle("Previsualizar cambios"));
    await waitFor(() => expect(screen.getByTitle("Guardar cambios")).toBeEnabled());
    await user.selectOptions(screen.getByLabelText("Tipo de ajuste"), "2");
    expect(screen.getByTitle("Guardar cambios")).toBeDisabled();
  });
});

describe("CambioPreciosMasivo: guardado", () => {
  const conPreview = async (user: ReturnType<typeof userEvent.setup>) => {
    preview.mockResolvedValue({ items: [{ productoId: 1, precioActual: 100, precioNuevo: 110, valido: true }], cantidadTotal: 1, cantidadInvalidos: 0 } as never);
    render(<CambioPreciosMasivo />);
    await alcanceGlobal(user);
    await ingresarValor(user, "10");
    await user.click(screen.getByTitle("Previsualizar cambios"));
    await waitFor(() => expect(screen.getByTitle("Guardar cambios")).toBeEnabled());
  };

  it("confirma, guarda con el mismo DTO, avisa y refresca la tabla", async () => {
    const user = userEvent.setup();
    guardar.mockResolvedValue({ mensaje: "Se actualizaron 2 productos" } as never);
    await conPreview(user);
    const llamadas = obtener.mock.calls.length;

    await user.click(screen.getByTitle("Guardar cambios"));

    await waitFor(() => expect(guardar).toHaveBeenCalledWith({ tipo: 1, valor: 10, alcance: "GLOBAL", lineaId: undefined, usuarioId: 7 }));
    expect(await screen.findByText("Se actualizaron 2 productos")).toBeInTheDocument();
    await waitFor(() => expect(obtener.mock.calls.length).toBeGreaterThan(llamadas));
    expect(screen.getByTitle("Guardar cambios")).toBeDisabled();
  });

  it("sin mensaje del backend usa uno por defecto", async () => {
    const user = userEvent.setup();
    guardar.mockResolvedValue({} as never);
    await conPreview(user);
    await user.click(screen.getByTitle("Guardar cambios"));
    expect(await screen.findByText("Precios actualizados correctamente.")).toBeInTheDocument();
  });

  it("si se cancela la confirmación no guarda", async () => {
    const user = userEvent.setup();
    await conPreview(user);
    ctx.confirmar = false;
    await user.click(screen.getByTitle("Guardar cambios"));
    expect(guardar).not.toHaveBeenCalled();
  });

  it("si el backend rechaza el guardado muestra su mensaje o uno que aclara que no se modificó nada", async () => {
    const user = userEvent.setup();
    guardar.mockRejectedValueOnce({ response: { data: { message: "Precio inválido en 1 producto" } } });
    await conPreview(user);

    await user.click(screen.getByTitle("Guardar cambios"));
    expect(await screen.findByText("Precio inválido en 1 producto")).toBeInTheDocument();
  });

  it("error sin detalle: informa que la operación fue rechazada sin modificar precios", async () => {
    const user = userEvent.setup();
    guardar.mockRejectedValueOnce(new Error("x"));
    await conPreview(user);
    await user.click(screen.getByTitle("Guardar cambios"));
    expect(await screen.findByText(/rechazada sin modificar precios/)).toBeInTheDocument();
  });

  it("alcance por línea envía la línea elegida en el DTO", async () => {
    const user = userEvent.setup();
    ctx.valoresFiltros = { lineaId: 3 };
    preview.mockResolvedValue({ items: [{ productoId: 1, precioActual: 100, precioNuevo: 110, valido: true }], cantidadTotal: 1, cantidadInvalidos: 0 } as never);
    render(<CambioPreciosMasivo />);
    await user.selectOptions(screen.getByLabelText("Seleccioná el alcance de la modificación"), "LINEA");
    await user.click(screen.getByTitle("Buscar productos"));
    await screen.findByText("PRODUCTO 1");

    await ingresarValor(user, "10");
    await user.click(screen.getByTitle("Previsualizar cambios"));

    await waitFor(() => expect(preview).toHaveBeenCalledWith({ tipo: 1, valor: 10, alcance: "LINEA", lineaId: 3, usuarioId: 7 }));
  });

  it("guardar sin previsualización válida pide generarla primero", async () => {
    const user = userEvent.setup();
    render(<CambioPreciosMasivo />);
    await alcanceGlobal(user);
    fireEvent.click(screen.getByTitle("Guardar cambios"));
    expect(guardar).not.toHaveBeenCalled();
    await act(async () => undefined);
  });
});
