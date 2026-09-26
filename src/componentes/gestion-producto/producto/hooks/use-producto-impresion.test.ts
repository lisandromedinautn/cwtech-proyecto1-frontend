import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/producto-service", () => ({ default: { imprimirTodo: vi.fn() } }));

import ProductoService from "../services/producto-service";
import { useProductoImpresion } from "./use-producto-impresion";

describe("useProductoImpresion", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = vi.fn().mockReturnValue("blob:x");
    vi.spyOn(window, "open").mockImplementation(() => null);
  });
  afterEach(() => vi.restoreAllMocks());

  it("abre el PDF en una pestaña nueva, tanto para todo como para la página", async () => {
    vi.mocked(ProductoService.imprimirTodo).mockResolvedValue("pdf" as never);
    const { result } = renderHook(() => useProductoImpresion());

    await act(() => result.current.handleImprimirTodo());
    await act(() => result.current.handleImprimirPagina());

    expect(window.open).toHaveBeenCalledTimes(2);
    expect(window.open).toHaveBeenCalledWith("blob:x", "_blank");
  });

  it("si el backend falla no abre nada ni rompe", async () => {
    vi.mocked(ProductoService.imprimirTodo).mockRejectedValue(new Error("x"));
    const { result } = renderHook(() => useProductoImpresion());

    await act(() => result.current.handleImprimirTodo());
    await act(() => result.current.handleImprimirPagina());

    expect(window.open).not.toHaveBeenCalled();
  });
});
