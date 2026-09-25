import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock("../componentes/gestion-usuario/usuario-service", () => ({
  default: { obtenerUsuarioId: vi.fn() },
}));

import ApiService from "./apiService";
import { createCrudService } from "./crudFactory";
import UsuarioService from "../componentes/gestion-usuario/usuario-service";
import ProductoService, { buildProductoSearchParams } from "../componentes/gestion-producto/producto/services/producto-service";
import CambioPreciosMasivoService from "../componentes/gestion-producto/precios/cambio-precios-masivo/cambio-precios-masivo-service";
import ListaPreciosService from "../componentes/gestion-producto/precios/lista_precios/service/lista-precios-service";

const axiosMock = vi.mocked(axios) as unknown as Record<"get" | "post" | "put" | "delete" | "patch", ReturnType<typeof vi.fn>>;

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("ApiService", () => {
  it("envía el token en el header Authorization cuando existe", async () => {
    localStorage.setItem("Token", "abc");
    axiosMock.get.mockResolvedValue({ data: { ok: 1 } });

    const data = await ApiService.get("/x", { a: 1 });

    expect(data).toEqual({ ok: 1 });
    expect(axiosMock.get.mock.calls[0][1]).toMatchObject({ params: { a: 1 }, headers: { Authorization: "Bearer abc" } });
  });

  it("sin token no manda Authorization", async () => {
    axiosMock.get.mockResolvedValue({ data: 1 });
    await ApiService.get("/x");
    expect(axiosMock.get.mock.calls[0][1].headers).toEqual({});
  });

  it.each([
    ["get", () => ApiService.get("/x")],
    ["get", () => ApiService.imprimir("/x")],
    ["post", () => ApiService.post("/x", {})],
    ["put", () => ApiService.put("/x", {})],
    ["delete", () => ApiService.delete("/x", 1)],
    ["patch", () => ApiService.patch("/x", {})],
  ])("propaga el error de %s", async (metodo, llamar) => {
    axiosMock[metodo as "get"].mockRejectedValue(new Error("falló"));
    await expect(llamar()).rejects.toThrow("falló");
  });

  it("post, put, delete y patch devuelven el data de la respuesta", async () => {
    axiosMock.post.mockResolvedValue({ data: "p" });
    axiosMock.put.mockResolvedValue({ data: "u" });
    axiosMock.delete.mockResolvedValue({ data: "d" });
    axiosMock.patch.mockResolvedValue({ data: "t" });

    expect(await ApiService.post("/x", { a: 1 })).toBe("p");
    expect(await ApiService.put("/x", { a: 1 })).toBe("u");
    expect(await ApiService.delete("/x", 9)).toBe("d");
    expect(axiosMock.delete.mock.calls[0][1].params).toEqual({ usuarioId: 9 });
    expect(await ApiService.patch("/x", { a: 1 })).toBe("t");
  });

  it("imprimir pide un blob y imprimirPost lo pide por POST", async () => {
    axiosMock.get.mockResolvedValue({ data: "blob" });
    axiosMock.post.mockResolvedValue({ data: "blob2" });

    expect(await ApiService.imprimir("/pdf")).toBe("blob");
    expect(axiosMock.get.mock.calls[0][1].responseType).toBe("blob");

    await ApiService.imprimirPost("/pdf", { a: 1 });
    expect(axiosMock.post.mock.calls[0][2]).toEqual({ responseType: "blob" });
  });
});

describe("createCrudService", () => {
  const crud = createCrudService<{ a: number }>("cosa");

  beforeEach(() => {
    axiosMock.get.mockResolvedValue({ data: "get" });
    axiosMock.post.mockResolvedValue({ data: "post" });
    axiosMock.put.mockResolvedValue({ data: "put" });
    axiosMock.delete.mockResolvedValue({ data: "del" });
  });

  const urlDe = (metodo: "get" | "post" | "put" | "delete") => axiosMock[metodo].mock.calls[axiosMock[metodo].mock.calls.length - 1][0] as string;

  it("arma la URL de cada operación", async () => {
    await crud.nuevo({ a: 1 });
    expect(urlDe("post")).toMatch(/\/cosa$/);
    await crud.actualizar(4, { a: 1 });
    expect(urlDe("put")).toMatch(/\/cosa\/4$/);
    await crud.eliminar(4, 2);
    expect(urlDe("delete")).toMatch(/\/cosa\/4$/);

    const gets: [() => Promise<unknown>, RegExp][] = [
      [() => crud.obtenerId(3, 1), /\/cosa\/3$/],
      [() => crud.obtener({}), /\/cosa\/search-by$/],
      [() => crud.imprimirTodo(), /\/cosa\/imprimir-listado-todo$/],
      [() => crud.imprimirPagina(), /\/cosa\/imprimir-listado-pagina$/],
      [() => crud.obtenerRapido({}), /\/cosa\/search-by-rapido$/],
      [() => crud.obtenerDesde({}, "marcas"), /\/cosa\/search-marcas-by$/],
      [() => crud.obtenerRapidoDesde({}, "marcas"), /\/cosa\/search-marcas-by-rapido$/],
      [() => crud.obtenerTotales({}, "marcas"), /\/cosa\/find-all-for-marcas\/select$/],
      [() => crud.obtenerTotalesSinSistema({}, "marcas"), /find-all-for-marcas-sin-sistema\/select$/],
      [() => crud.obtenerTotalesSistema({}, "marcas"), /find-all-for-marcas-sistema\/select$/],
      [() => crud.obtenerTotalesPara(5, "marcas"), /find-all-for-marcas-for\/5\/select$/],
      [() => crud.obtenerTotalesSinFacturarPara(5, "x"), /find-all-for-x-sin-facturar-for\/5\/select$/],
      [() => crud.obtenerTotalesSinPedidoPara(5, "x"), /find-all-for-x-sin-pedido-for\/5\/select$/],
      [() => crud.obtenerItemsPara(5, "x"), /find-all-items-for-x-for\/5$/],
      [() => crud.obtenerIdEntidad(5, "x"), /\/cosa\/x\/5$/],
      [() => crud.obtenerAuditoria(5), /\/cosa\/5\/audit$/],
    ];
    for (const [llamar, patron] of gets) {
      await llamar();
      expect(urlDe("get")).toMatch(patron);
    }
  });

  it("obtenerUsuarioId devuelve el usuario o falla si no existe", async () => {
    vi.mocked(UsuarioService.obtenerUsuarioId).mockResolvedValueOnce({ id: 3 } as never);
    expect(await crud.obtenerUsuarioId(3)).toEqual({ id: 3 });

    vi.mocked(UsuarioService.obtenerUsuarioId).mockResolvedValueOnce(null as never);
    await expect(crud.obtenerUsuarioId(9)).rejects.toThrow("No se encontró el usuario");
  });
});

describe("ProductoService", () => {
  beforeEach(() => {
    axiosMock.get.mockResolvedValue({ data: { ok: true } });
    axiosMock.post.mockResolvedValue({ data: { ok: true } });
    axiosMock.patch.mockResolvedValue({ data: { ok: true } });
  });

  it("buildProductoSearchParams recorta, omite vacíos y marca incluirEliminados", () => {
    expect(buildProductoSearchParams({ denominacion: "  aceite ", linea: " ", skip: 0, take: 10 })).toEqual({
      denominacion: "aceite",
      skip: 0,
      take: 10,
    });
    expect(
      buildProductoSearchParams({ superlinea: "bebidas", incluirEliminados: true, skip: 10, take: 5 }),
    ).toEqual({ superlinea: "bebidas", incluirEliminados: "true", skip: 10, take: 5 });
  });

  it("consulta y ajusta stock por el ApiService", async () => {
    await ProductoService.ajustarStockManual(4, { cantidad: 2, motivo: "m", usuarioId: 1 });
    expect(axiosMock.post.mock.calls[0][0]).toMatch(/\/producto\/4\/ajustar-manual$/);

    await ProductoService.obtenerHistorialPrecios(4, 0, 10);
    expect(axiosMock.get.mock.calls[0][0]).toMatch(/\/producto\/4\/historial-precios$/);
    expect(axiosMock.get.mock.calls[0][1].params).toEqual({ skip: 0, take: 10 });

    await ProductoService.buscarPorFiltros({ denominacion: "a", skip: 0, take: 10 });
    expect(axiosMock.get.mock.calls[1][0]).toMatch(/\/producto\/search-by$/);
  });

  it("obtenerMobile, actualizarPreciosProducto y flete usan el token", async () => {
    localStorage.setItem("Token", "t");

    await ProductoService.obtenerMobile({ a: 1 });
    expect(axiosMock.get.mock.calls[0][1].headers).toEqual({ Authorization: "Bearer t" });

    await ProductoService.actualizarPreciosProducto(3, { x: 1 });
    expect(axiosMock.patch.mock.calls[0][0]).toMatch(/\/producto\/3\/precios$/);

    axiosMock.post.mockResolvedValueOnce({ data: { precioConFlete: 12 } });
    expect(await ProductoService.calcularPrecioConFlete(10, 1, 2)).toEqual({ precioConFlete: 12 });
  });

  it("los cálculos de precios devuelven null si la API falla", async () => {
    axiosMock.post.mockRejectedValue(new Error("x"));
    expect(await ProductoService.calcularPreciosConPorcentaje(1, 1, 1, 1, 1)).toBeNull();
    expect(await ProductoService.calcularPreciosEnCrearProducto(21, 1, 1, 1, 1)).toBeNull();
  });

  it("los cálculos de precios devuelven el resultado si la API responde", async () => {
    axiosMock.post.mockResolvedValue({ data: { precio: 5 } });
    expect(await ProductoService.calcularPreciosConPorcentaje(1, 1, 1, 1, 1)).toEqual({ precio: 5 });
    expect(await ProductoService.calcularPreciosEnCrearProducto(21, 1, 1, 1, 1)).toEqual({ precio: 5 });
  });

  it("obtenerMobile y actualizarPreciosProducto propagan errores", async () => {
    axiosMock.get.mockRejectedValue(new Error("mobile"));
    axiosMock.patch.mockRejectedValue(new Error("patch"));
    await expect(ProductoService.obtenerMobile({})).rejects.toThrow("mobile");
    await expect(ProductoService.actualizarPreciosProducto(1, {})).rejects.toThrow("patch");
  });
});

describe("CambioPreciosMasivoService", () => {
  it("normaliza los números del payload antes de enviar la vista previa y el guardado", async () => {
    axiosMock.post.mockResolvedValue({ data: { ok: true } });
    localStorage.setItem("Token", "t");

    const payload = { tipo: "1" as unknown as number, valor: "10" as unknown as number, alcance: "LINEA" as const, lineaId: "3" as unknown as number, usuarioId: "7" as unknown as number };
    await CambioPreciosMasivoService.aplicarCambios(payload);
    await CambioPreciosMasivoService.guardarCambios({ tipo: 1, valor: 5, alcance: "GLOBAL" });

    expect(axiosMock.post.mock.calls[0][0]).toMatch(/\/producto\/cambio-precios-masivo\/preview$/);
    expect(axiosMock.post.mock.calls[0][1]).toEqual({ tipo: 1, valor: 10, alcance: "LINEA", lineaId: 3, usuarioId: 7 });
    expect(axiosMock.post.mock.calls[1][0]).toMatch(/\/producto\/ajustar-precios-masivo$/);
    expect(axiosMock.post.mock.calls[1][1]).toMatchObject({ lineaId: undefined, usuarioId: undefined });
  });

  it("propaga los errores", async () => {
    axiosMock.post.mockRejectedValue(new Error("boom"));
    await expect(CambioPreciosMasivoService.aplicarCambios({ tipo: 1, valor: 1, alcance: "GLOBAL" })).rejects.toThrow("boom");
    await expect(CambioPreciosMasivoService.guardarCambios({ tipo: 1, valor: 1, alcance: "GLOBAL" })).rejects.toThrow("boom");
  });
});

describe("ListaPreciosService", () => {
  it("aplica, guarda e imprime", async () => {
    axiosMock.patch.mockResolvedValue({ data: "ok" });
    axiosMock.post.mockResolvedValue({ data: "pdf" });
    localStorage.setItem("Token", "t");

    expect(await ListaPreciosService.aplicarCambios({ a: 1 })).toBe("ok");
    expect(await ListaPreciosService.guardarCambios({ a: 1 })).toBe("ok");
    expect(await ListaPreciosService.imprimirListaPrecios({ a: 1 })).toBe("pdf");
    expect(axiosMock.post.mock.calls[0][2]).toMatchObject({ responseType: "blob" });
  });

  it("propaga los errores", async () => {
    axiosMock.patch.mockRejectedValue(new Error("p"));
    axiosMock.post.mockRejectedValue(new Error("q"));
    await expect(ListaPreciosService.aplicarCambios({})).rejects.toThrow("p");
    await expect(ListaPreciosService.guardarCambios({})).rejects.toThrow("p");
    await expect(ListaPreciosService.imprimirListaPrecios({})).rejects.toThrow("q");
  });
});
