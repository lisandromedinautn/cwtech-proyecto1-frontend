import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import { selectUiMock } from "../../test/mock-select";

vi.mock("../ui/Select", () => selectUiMock);
vi.mock("react-select", () => ({
  default: ({ options, onChange, value, placeholder, getOptionLabel, isDisabled }: any) => (
    <div>
      <span data-testid="valor">{value ? getOptionLabel(value) : placeholder}</span>
      {options.map((o: any) => (
        <button key={o.id} type="button" disabled={isDisabled} onClick={() => onChange(o)}>
          {getOptionLabel(o)}
        </button>
      ))}
    </div>
  ),
}));
vi.mock("./superlinea/services/superlinea-service", () => ({ default: { obtener: vi.fn() } }));

import SuperlineaService from "./superlinea/services/superlinea-service";
import SuperlineasSelector from "./superlinea/componentes/superlineas-selector";
import SuperlineaFiltro from "./superlinea/componentes/superlinea-filtro";
import LineasSelector from "./producto/componentes/configuracion/lineas-selector";
import MarcasSelector from "./producto/componentes/configuracion/marcas-selector";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const opciones = { data: [{ id: 1, denominacion: "BEBIDAS", extra: 1 }, { id: 2, denominacion: "ALMACEN" }] };

function ConFormulario({ valor, error, disabled }: { valor?: number; error?: string; disabled?: boolean }) {
  const methods = useForm({ defaultValues: { superlineaId: valor } });
  useEffect(() => {
    if (error) methods.setError("superlineaId", { message: error });
  }, [error]);
  return (
    <FormProvider {...methods}>
      <SuperlineasSelector disabled={disabled} />
      <output data-testid="form-valor">{String(methods.watch("superlineaId"))}</output>
    </FormProvider>
  );
}

describe("SuperlineasSelector", () => {
  it("carga las opciones, permite elegir y refleja el valor en el formulario", async () => {
    const user = userEvent.setup();
    vi.mocked(SuperlineaService.obtener).mockResolvedValue(opciones);

    render(<ConFormulario />);
    expect(await screen.findByText("BEBIDAS")).toBeInTheDocument();
    expect(SuperlineaService.obtener).toHaveBeenCalledWith({ skip: 0, take: 1000 });

    await user.click(screen.getByText("ALMACEN"));
    expect(screen.getByTestId("form-valor")).toHaveTextContent("2");
  });

  it("sin opciones avisa que no hay SuperLíneas", async () => {
    vi.mocked(SuperlineaService.obtener).mockResolvedValue({ data: undefined });
    render(<ConFormulario valor={1} />);
    expect(await screen.findByText("No hay SuperLíneas disponibles.")).toBeInTheDocument();
  });

  it("muestra el error de validación del campo", async () => {
    vi.mocked(SuperlineaService.obtener).mockResolvedValue(opciones);
    render(<ConFormulario error="La SuperLínea es obligatoria." />);
    expect(await screen.findByText("La SuperLínea es obligatoria.")).toBeInTheDocument();
  });

  it("mientras carga está deshabilitado", async () => {
    let resolver!: (v: unknown) => void;
    vi.mocked(SuperlineaService.obtener).mockReturnValue(new Promise((r) => (resolver = r)) as never);
    render(<ConFormulario />);
    expect(screen.getByTestId("select")).toHaveAttribute("data-disabled", "true");
    expect(screen.getByText("Cargando SuperLíneas...")).toBeInTheDocument();
    resolver(opciones);
    await waitFor(() => expect(screen.getByTestId("select")).toHaveAttribute("data-disabled", "false"));
  });
});

describe("SuperlineaFiltro", () => {
  it("elige una SuperLínea o vuelve a 'todas'", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    vi.mocked(SuperlineaService.obtener).mockResolvedValue(opciones);

    render(<SuperlineaFiltro value={1} onChange={onChange} />);
    await screen.findByText("BEBIDAS");

    expect(screen.getByTestId("select")).toHaveAttribute("data-value", "1");
    await user.click(screen.getByText("ALMACEN"));
    expect(onChange).toHaveBeenCalledWith(2);
    await user.click(screen.getByText("Todas las SuperLíneas", { selector: "button" }));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it("sin valor selecciona 'todas' y usa la etiqueta indicada", async () => {
    vi.mocked(SuperlineaService.obtener).mockResolvedValue({ data: [] });
    render(<SuperlineaFiltro onChange={vi.fn()} label="Filtro" />);
    await waitFor(() => expect(screen.getByTestId("select")).toHaveAttribute("data-value", "todas"));
    expect(screen.getByText("Filtro")).toBeInTheDocument();
  });
});

describe("LineasSelector", () => {
  const props = () => ({
    denominacionLinea: "ac",
    setDenominacionLinea: vi.fn(),
    denominacionLineaRef: createRef<HTMLInputElement>(),
    selectLineaRef: createRef<HTMLDivElement>(),
    lineas: [{ id: 1, denominacion: "ACEITES" }, { id: 2, denominacion: "GASEOSAS" }] as never[],
    selectedLinea: null,
    lineaId: 0,
    onEnterDenominacion: vi.fn(),
    onEnterLinea: vi.fn(),
    onLineaChange: vi.fn(),
    onAgregarLinea: vi.fn(),
  });

  it("filtra por texto, selecciona y agrega una línea", async () => {
    const user = userEvent.setup();
    const p = props();
    render(<LineasSelector {...p} />);

    await user.type(screen.getByPlaceholderText("Denominación"), " x");
    expect(p.setDenominacionLinea).toHaveBeenCalled();
    await user.keyboard("{Enter}");
    expect(p.onEnterLinea).toHaveBeenCalled();

    await user.click(screen.getByText("GASEOSAS"));
    expect(p.onLineaChange).toHaveBeenCalledWith({ id: 2, denominacion: "GASEOSAS" });

    await user.click(screen.getByTitle("Agregar Línea"));
    expect(p.onAgregarLinea).toHaveBeenCalled();
  });

  it("muestra la línea elegida, el error y respeta disabled", () => {
    const p = props();
    render(<LineasSelector {...p} lineaId={1} disabled errors={{ lineaId: { message: "Falta línea" } }} />);
    expect(screen.getByTestId("valor")).toHaveTextContent("ACEITES");
    expect(screen.getByText("Falta línea")).toBeInTheDocument();
    expect(screen.getByTitle("Agregar Línea")).toBeDisabled();
  });

  it("si el id no está en la lista usa la línea seleccionada", () => {
    const p = props();
    render(<LineasSelector {...p} lineaId={99} selectedLinea={{ id: 99, denominacion: "OTRA" } as never} />);
    expect(screen.getByTestId("valor")).toHaveTextContent("OTRA");
  });
});

describe("MarcasSelector", () => {
  it("delega en el selector base con el título Marcas", () => {
    render(
      <MarcasSelector
        denominacionMarca=""
        setDenominacionMarca={vi.fn()}
        denominacionMarcaRef={createRef<HTMLInputElement>()}
        selectMarcaRef={createRef<HTMLDivElement>()}
        marcas={[{ id: 1, denominacion: "NATURA" }] as never[]}
        selectedMarca={null}
        marcaId={0}
        onEnterMarca={vi.fn()}
        onChangeMarca={vi.fn()}
        onAgregarMarca={vi.fn()}
      />,
    );
    expect(screen.getByText("Marcas")).toBeInTheDocument();
  });
});
