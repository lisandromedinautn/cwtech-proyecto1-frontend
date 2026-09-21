import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

const makeJwt = (roles: number[]) => {
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

describe('PrivateRoute - escenarios de autorización', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it.each([
    ['sin token', null, 'Pantalla de login'],
    ['token corrupto', 'token-mal-formado', 'Pantalla de login'],
    ['sin permiso', makeJwt([99]), 'Panel de administración'],
    ['con permiso', makeJwt([2]), 'Contenido privado'],
  ])('cuando el usuario está %s', (_, token, expectedText) => {
    if (token) localStorage.setItem('Token', token);

    renderProtectedRoute();

    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });
});
