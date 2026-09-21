import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

const createToken = (roles: number[]) => {
  const encodeBase64 = (value: unknown) =>
    btoa(JSON.stringify(value))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  return `${encodeBase64({ alg: 'none', typ: 'JWT' })}.${encodeBase64({ roles })}.signature`;
};

const renderProtectedRoute = () =>
  render(
    <MemoryRouter initialEntries={['/privada']}>
      <Routes>
        <Route path="/privada" element={<PrivateRoute allowedRoles={[1, 2]} />}>
          <Route index element={<div>Contenido privado</div>} />
        </Route>
        <Route path="/login" element={<div>Pantalla de login</div>} />
        <Route path="/admin" element={<div>Panel de administración</div>} />
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

  it('redirige al admin cuando el token no tiene permiso', () => {
    localStorage.setItem('Token', createToken([3]));

    renderProtectedRoute();

    expect(screen.getByText('Panel de administración')).toBeInTheDocument();
  });

  it('permite acceder cuando el token tiene permiso', () => {
    localStorage.setItem('Token', createToken([2]));

    renderProtectedRoute();

    expect(screen.getByText('Contenido privado')).toBeInTheDocument();
  });
});
