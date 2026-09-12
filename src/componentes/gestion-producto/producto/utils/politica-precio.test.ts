import { describe, expect, it } from "vitest";
import { sinCamposPrecioDerivados } from "../interfaces/interfaces-validaciones-producto";
import { calcularPrecioEstimado, MARGEN_GENERAL } from "./politica-precio";

describe("politica de precio en el formulario", () => {
  it("proyecta el precio con el margen general cuando no hay uno particular", () => {
    expect(calcularPrecioEstimado(100)).toBe(115);
    expect(calcularPrecioEstimado(100, 0)).toBe(100);
    expect(calcularPrecioEstimado(10.12345, 12.5)).toBe(11.38888);
    expect(MARGEN_GENERAL).toBe(15);
  });

  it("no envía precio ni porcentaje heredados al backend", () => {
    const payload = sinCamposPrecioDerivados({
      denominacion: "Producto de prueba",
      costo: 100,
      margen: 20,
      lineaId: 1,
      marcaId: 2,
      alicuotaIva: 21,
      precio: 120,
      porcentaje: 20,
    } as any);

    expect(payload).toMatchObject({ costo: 100, margen: 20 });
    expect(payload).not.toHaveProperty("precio");
    expect(payload).not.toHaveProperty("porcentaje");
  });
});
