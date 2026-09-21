import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

const createJwt = (roles: number[]) => {
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
    sub: 1,
    roles,
    empresaId: 10,
    puntoVentaId: 20,
  })}.signature`;
};

const renderProtectedRoute = () =>
  render(
    <MemoryRouter initialEntries={['/privada']}>
      <Routes>
        <Route path="/login" element={<div>Pantalla de login</div>} />
        <Route path="/admin" element={<div>Panel de administración</div>} />
        <Route element={<PrivateRoute allowedRoles={[1, 2]} />}>
          <Route path="/privada" element={<div>Contenido privado</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('PrivateRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('redirige al login cuando no hay token', () => {
    renderProtectedRoute();

    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
  });

  it('redirige al login cuando el token es corrupto', () => {
    localStorage.setItem('Token', 'token-corrupto');

    renderProtectedRoute();

    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
  });

  it('redirige al admin cuando el usuario no tiene permiso', () => {
    localStorage.setItem('Token', createJwt([99]));

    renderProtectedRoute();

    expect(screen.getByText('Panel de administración')).toBeInTheDocument();
  });

  it('permite acceder cuando el usuario tiene permiso', () => {
    localStorage.setItem('Token', createJwt([2]));

    renderProtectedRoute();

    expect(screen.getByText('Contenido privado')).toBeInTheDocument();
  });
});
