import { describe, expect, it } from "vitest";
import { Rol } from "../../../../interfaces/generales/interfaces-generales";
import {
  puedeAgregarProducto,
  puedeEditarProducto,
  puedeEliminarProducto,
  puedeHacerAcciones,
  puedeVerPrecios,
  puedeVerProductos,
} from "./permisos-producto";

const soloAdmin = [puedeAgregarProducto, puedeEditarProducto, puedeEliminarProducto, puedeHacerAcciones];

describe("permisos de producto por rol", () => {
  it.each(soloAdmin.map((f) => [f.name, f] as const))("%s: solo el administrador", (_n, permiso) => {
    expect(permiso([Rol.ADMINISTRADOR])).toBe(true);
    expect(permiso([Rol.VENDEDOR])).toBe(false);
    expect(permiso([Rol.REPARTIDOR])).toBe(false);
    expect(permiso([])).toBe(false);
  });

  it("puede ver productos: administrador, vendedor y repartidor", () => {
    expect(puedeVerProductos([Rol.ADMINISTRADOR])).toBe(true);
    expect(puedeVerProductos([Rol.VENDEDOR])).toBe(true);
    expect(puedeVerProductos([Rol.REPARTIDOR])).toBe(true);
    expect(puedeVerProductos([])).toBe(false);
  });

  it("puede ver precios: administrador y vendedor, no el repartidor", () => {
    expect(puedeVerPrecios([Rol.ADMINISTRADOR])).toBe(true);
    expect(puedeVerPrecios([Rol.VENDEDOR])).toBe(true);
    expect(puedeVerPrecios([Rol.REPARTIDOR])).toBe(false);
  });

  it("un usuario con varios roles alcanza con que uno lo habilite", () => {
    expect(puedeEditarProducto([Rol.VENDEDOR, Rol.ADMINISTRADOR])).toBe(true);
  });
});
