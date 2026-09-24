import { describe, expect, it } from "vitest";
import { menuItems } from "./menuItems-definicion";

describe("menú de Gestión Productos", () => {
  it("ofrece Envases dentro de Configuración, junto a Marca y Líneas", () => {
    const configuracion = menuItems
      .find((item) => item.label === "Gestión Productos")
      ?.subMenu?.find((item) => item.label === "Configuración");

    const opciones = configuracion?.subMenu?.map((item) => [item.label, item.path]);

    expect(opciones).toEqual(
      expect.arrayContaining([
        ["Marca", "marca"],
        ["Líneas", "linea"],
        ["Envases", "envase-presentacion"],
      ]),
    );
  });
});
