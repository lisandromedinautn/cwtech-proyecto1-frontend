import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../cambio-precios-masivo-service", () => ({ default: { aplicarCambios: vi.fn(), guardarCambios: vi.fn() } }));
vi.mock("../../../producto/services/producto-service", () => ({ default: { obtener: vi.fn() } }));

import CambioPreciosMasivoService from "../cambio-precios-masivo-service";
import ProductoService from "../../../producto/services/producto-service";
import { useCambioPrecios } from "./useCambioPrecios";

const dto = { tipo: 1, valor: 10, alcance: "GLOBAL" as const, usuarioId: 1 };

describe("useCambioPrecios (cambio masivo)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("busca productos por línea con paginación y guarda total y página", async () => {
    vi.mocked(ProductoService.obtener).mockResolvedValue({ data: [{ id: 1 }], total: 9 } as never);
    const { result } = renderHook(() => useCambioPrecios(1));

    await act(() => result.current.buscarProductos({ lineaId: 4 }, 20, 5));

    expect(ProductoService.obtener).toHaveBeenCalledWith({ lineaId: 4, skip: 20, take: 5 });
    expect(result.current.productos).toEqual([{ id: 1 }]);
    expect(result.current.entidadesTotales).toBe(9);
    expect(result.current.loading).toBe(false);
  });

  it("apaga el loading aunque la búsqueda falle", async () => {
    vi.mocked(ProductoService.obtener).mockRejectedValue(new Error("x"));
    const { result } = renderHook(() => useCambioPrecios(1));

    await act(async () => {
      await expect(result.current.buscarProductos({})).rejects.toThrow("x");
    });
    expect(result.current.loading).toBe(false);
  });

  it("aplicarCambios normaliza un resultado con items y arma el mapa del preview", async () => {
    vi.mocked(CambioPreciosMasivoService.aplicarCambios).mockResolvedValue({
      items: [{ productoId: 1, precioActual: 10, precioNuevo: 11, valido: true }],
      cantidadTotal: 1,
      cantidadInvalidos: 0,
    } as never);
    const { result } = renderHook(() => useCambioPrecios(1));

    let resultado: unknown;
    await act(async () => {
      resultado = await result.current.aplicarCambios(dto);
    });

    expect(resultado).toMatchObject({ cantidadTotal: 1, cantidadInvalidos: 0 });
    expect(result.current.preview.get(1)).toMatchObject({ precioNuevo: 11 });
  });

  it("aplicarCambios acepta un arreglo plano y calcula totales e inválidos", async () => {
    vi.mocked(CambioPreciosMasivoService.aplicarCambios).mockResolvedValue([
      { id: 1, denominacion: "A", precioActual: "10", precioNuevo: 12 },
      { productoId: 2, precioActual: 5, precioNuevo: null, valido: false },
    ] as never);
    const { result } = renderHook(() => useCambioPrecios(1));

    let resultado: any;
    await act(async () => {
      resultado = await result.current.aplicarCambios(dto);
    });

    expect(resultado.cantidadTotal).toBe(2);
    expect(resultado.cantidadInvalidos).toBe(1);
    expect(result.current.preview.get(1)).toMatchObject({ precioActual: 10, valido: true });
    expect(result.current.preview.get(2)?.valido).toBe(false);
  });

  it("aplicarCambios tolera un resultado sin items", async () => {
    vi.mocked(CambioPreciosMasivoService.aplicarCambios).mockResolvedValue(undefined as never);
    const { result } = renderHook(() => useCambioPrecios(1));
    let resultado: any;
    await act(async () => {
      resultado = await result.current.aplicarCambios(dto);
    });
    expect(resultado).toEqual({ items: [], cantidadTotal: 0, cantidadInvalidos: 0 });
  });

  it("guardarCambios limpia el preview y devuelve la respuesta; si falla apaga el loading", async () => {
    vi.mocked(CambioPreciosMasivoService.aplicarCambios).mockResolvedValue({ items: [{ productoId: 1, precioActual: 1, precioNuevo: 2, valido: true }] } as never);
    vi.mocked(CambioPreciosMasivoService.guardarCambios).mockResolvedValueOnce({ mensaje: "ok" } as never);
    const { result } = renderHook(() => useCambioPrecios(1));
    await act(async () => {
      await result.current.aplicarCambios(dto);
    });
    expect(result.current.preview.size).toBe(1);

    let respuesta: unknown;
    await act(async () => {
      respuesta = await result.current.guardarCambios(dto);
    });
    expect(respuesta).toEqual({ mensaje: "ok" });
    expect(result.current.preview.size).toBe(0);

    vi.mocked(CambioPreciosMasivoService.guardarCambios).mockRejectedValueOnce(new Error("no"));
    await act(async () => {
      await expect(result.current.guardarCambios(dto)).rejects.toThrow("no");
    });
    expect(result.current.loading).toBe(false);
  });

  it("aplicarCambios apaga el loading si falla", async () => {
    vi.mocked(CambioPreciosMasivoService.aplicarCambios).mockRejectedValue(new Error("x"));
    const { result } = renderHook(() => useCambioPrecios(1));
    await act(async () => {
      await expect(result.current.aplicarCambios(dto)).rejects.toThrow("x");
    });
    expect(result.current.loading).toBe(false);
  });

  it("limpiarPreview y actualizarProductoLocal", async () => {
    vi.mocked(ProductoService.obtener).mockResolvedValue({ data: [{ id: 1, precio: 1 }, { id: 2, precio: 2 }], total: 2 } as never);
    const { result } = renderHook(() => useCambioPrecios(1));
    await act(() => result.current.buscarProductos({}));

    act(() => result.current.actualizarProductoLocal({ id: 2, precio: 99 } as never));
    expect(result.current.productos[1]).toMatchObject({ precio: 99, dirty: true });
    expect(result.current.productos[0]).toEqual({ id: 1, precio: 1 });

    act(() => result.current.limpiarPreview());
    expect(result.current.preview.size).toBe(0);
    act(() => result.current.setProductos([]));
    expect(result.current.productos).toEqual([]);
  });
});
