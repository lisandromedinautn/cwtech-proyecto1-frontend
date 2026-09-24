import { afterEach, describe, expect, it, vi } from "vitest";
import { jwtDecode } from "jwt-decode";
import { getAuthData, getRoles, getUsuarioId } from "./auth";

// jwtDecode queda reemplazado por un mock controlable para aislar el test
// del paquete: así verificamos que nuestros utils resuelven la sesión y que
// NO se intenta decodificar cuando no hay token.
vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(() => ({
    sub: 0,
    roles: [],
    empresaId: 0,
    puntoVentaId: 0,
  })),
}));

const jwtDecodeMock = vi.mocked(jwtDecode);

describe("auth (SYS-010): sin token", () => {
  afterEach(() => {
    localStorage.removeItem("Token");
    jwtDecodeMock.mockClear();
  });

  it("no intenta decodificar token inexistente y resuelve la sesión vacía", () => {
    localStorage.removeItem("Token");

    expect(getAuthData()).toEqual({
      usuarioId: 0,
      empresaId: 0,
      puntoVentaId: 0,
    });
    expect(getUsuarioId()).toBe(0);
    expect(getRoles()).toEqual([]);
    expect(jwtDecodeMock).not.toHaveBeenCalled();
  });
});

describe("auth (SYS-010): sesión consistente", () => {
  afterEach(() => {
    localStorage.removeItem("Token");
    jwtDecodeMock.mockReset();
  });

  it("decodifica el token y resuelve usuario y roles de forma consistente", () => {
    jwtDecodeMock.mockReturnValue({
      sub: 42,
      personalId: 7,
      roles: [1, 3],
      empresaId: 2,
      puntoVentaId: 1,
    });
    localStorage.setItem("Token", "token.mock.generico");

    expect(getAuthData()).toEqual({
      usuarioId: 42,
      empresaId: 2,
      puntoVentaId: 1,
    });
    expect(getUsuarioId()).toBe(42);
    expect(getRoles()).toEqual([1, 3]);
  });

  it("resuelve sesión vacía (0 / []) cuando el token no trae claims", () => {
    jwtDecodeMock.mockReturnValue({});
    localStorage.setItem("Token", "token.mock.generico");

    expect(getUsuarioId()).toBe(0);
    expect(getRoles()).toEqual([]);
  });
});