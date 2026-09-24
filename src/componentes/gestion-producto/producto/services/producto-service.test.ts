import { describe, expect, it } from "vitest";
import { buildProductoSearchParams } from "./producto-service";

describe("buildProductoSearchParams", () => {
  it("envía únicamente la denominación", () => {
    expect(
      buildProductoSearchParams({ denominacion: " leche ", skip: 0, take: 10 }),
    ).toEqual({ denominacion: "leche", skip: 0, take: 10 });
  });

  it("envía únicamente la línea", () => {
    expect(
      buildProductoSearchParams({ linea: " lacteos ", skip: 10, take: 10 }),
    ).toEqual({ linea: "lacteos", skip: 10, take: 10 });
  });

  it("envía únicamente la SuperLínea", () => {
    expect(
      buildProductoSearchParams({ superlinea: " bebidas ", skip: 0, take: 25 }),
    ).toEqual({ superlinea: "bebidas", skip: 0, take: 25 });
  });

  it("combina los tres filtros y conserva la paginación", () => {
    expect(
      buildProductoSearchParams({
        denominacion: " leche ",
        linea: " lacteos ",
        superlinea: " bebidas ",
        skip: 20,
        take: 10,
      }),
    ).toEqual({
      denominacion: "leche",
      linea: "lacteos",
      superlinea: "bebidas",
      skip: 20,
      take: 10,
    });
  });

  it("omite filtros vacíos o compuestos solo por espacios", () => {
    expect(
      buildProductoSearchParams({
        denominacion: "   ",
        linea: "",
        superlinea: undefined,
        skip: 0,
        take: 10,
      }),
    ).toEqual({ skip: 0, take: 10 });
  });
});
