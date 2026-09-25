import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../componentes/gestion-usuario/usuario-service", () => ({
  default: { obtenerUsuarioId: vi.fn() },
}));

import { navigationGuard } from "./navigation-guard";
import { obtenerUsuarioId } from "./usuarioHelper";
import UsuarioService from "../componentes/gestion-usuario/usuario-service";
import { schema as schemaAlternativo, transformData as transformAlternativo } from "../componentes/gestion-producto/producto/interfaces/interfaces-validaciones-item-prod-alternativo";
import { schema as schemaProveedor, transformData as transformProveedor } from "../componentes/gestion-producto/producto/interfaces/interfaces-validaciones-item-proveedor";

describe("navigationGuard", () => {
  beforeEach(() => navigationGuard.unregister());

  it("sin guard registrado permite navegar", () => {
    expect(navigationGuard.check()).toBe(true);
  });

  it("delega en el guard registrado y deja de hacerlo al desregistrarlo", () => {
    const guard = vi.fn().mockReturnValue(false);
    navigationGuard.register(guard);
    expect(navigationGuard.check()).toBe(false);
    expect(guard).toHaveBeenCalledTimes(1);

    navigationGuard.unregister();
    expect(navigationGuard.check()).toBe(true);
  });
});

describe("obtenerUsuarioId", () => {
  it("devuelve el usuario o falla si no existe", async () => {
    vi.mocked(UsuarioService.obtenerUsuarioId).mockResolvedValueOnce({ id: 1 } as never);
    expect(await obtenerUsuarioId(1)).toEqual({ id: 1 });

    vi.mocked(UsuarioService.obtenerUsuarioId).mockResolvedValueOnce(null as never);
    await expect(obtenerUsuarioId(2)).rejects.toThrow("No se encontró el usuario");
  });
});

describe("esquemas de ítems de producto", () => {
  it("producto alternativo: exige un producto numérico", async () => {
    await expect(schemaAlternativo.validate({ productoAlternativoId: 4 })).resolves.toBeTruthy();
    await expect(schemaAlternativo.validate({})).rejects.toThrow("Debe seleccionar un producto.");
    await expect(schemaAlternativo.validate({ productoAlternativoId: "x" })).rejects.toThrow("El producto es obligatoria.");
    expect(transformAlternativo({ productoAlternativoId: 9 } as never)).toEqual({ productoAlternativoId: 9 });
  });

  it("proveedor: exige proveedor y código", async () => {
    await expect(schemaProveedor.validate({ proveedorId: 1, codigoProveedor: "A1" })).resolves.toBeTruthy();
    await expect(schemaProveedor.validate({ codigoProveedor: "A1" })).rejects.toThrow("Debe seleccionar un proveedor.");
    await expect(schemaProveedor.validate({ proveedorId: 1 })).rejects.toThrow("El código proveedor es obligatorio.");
    expect(transformProveedor({ proveedorId: 2, codigoProveedor: null } as never)).toEqual({ proveedorId: 2, codigoProveedor: "" });
  });
});
