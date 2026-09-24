import { describe, expect, it } from "vitest";
import { vistaPreviaDenominacion } from "./denominacion-producto";
import { armarPayloadProducto, FormValues } from "../interfaces/interfaces-validaciones-producto";

const completos = {
  marca: "COCA-COLA",
  linea: "GASEOSAS",
  envase: "BOTELLA",
  cantidad: 500,
  unidad: "ml",
};

describe("vistaPreviaDenominacion (CR-005)", () => {
  it("arma Marca + Línea + Presentación, con el envase", () => {
    expect(vistaPreviaDenominacion(completos)).toBe("COCA-COLA GASEOSAS BOTELLA 500 ml");
  });

  it.each(["marca", "linea", "envase", "cantidad", "unidad"] as const)(
    "devuelve null si falta %s",
    (campo) => {
      expect(vistaPreviaDenominacion({ ...completos, [campo]: null })).toBeNull();
    },
  );

  it("no normaliza el contenido: eso lo hace el backend al guardar", () => {
    expect(vistaPreviaDenominacion({ ...completos, cantidad: 1000 })).toBe(
      "COCA-COLA GASEOSAS BOTELLA 1000 ml",
    );
  });
});

describe("armarPayloadProducto — denominación (CR-005)", () => {
  const base: FormValues = {
    denominacion: "coca cola",
    lineaId: 1,
    marcaId: 2,
    alicuotaIva: 21,
  };

  it("con la automática envía el flag y no la denominación", () => {
    const payload = armarPayloadProducto({ ...base, generarDenominacionAutomatica: true });

    expect(payload).toMatchObject({ generarDenominacionAutomatica: true });
    expect(payload).not.toHaveProperty("denominacion");
  });

  it.each([false, undefined])("con el flag en %s envía la denominación y no el flag", (flag) => {
    const payload = armarPayloadProducto({ ...base, generarDenominacionAutomatica: flag });

    expect(payload).toMatchObject({ denominacion: "coca cola" });
    expect(payload).not.toHaveProperty("generarDenominacionAutomatica");
  });
});
