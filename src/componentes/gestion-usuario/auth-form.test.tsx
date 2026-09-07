import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AuthForm from './auth-form';
import { ConfiguracionSistemaProvider } from '../sistema/ConfiguracionSistemaContext';
import UsuarioService from './usuario-service';

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => <button type="button">Iniciar con Google</button>,
}));

vi.mock('./usuario-service', () => ({
  default: {
    obtenerEmpresasTotales: vi.fn().mockResolvedValue([{ id: 1, denominacion: 'Empresa de prueba' }]),
    login: vi.fn(),
  },
}));

const renderAuthForm = () =>
  render(
    <ConfiguracionSistemaProvider>
      <AuthForm />
    </ConfiguracionSistemaProvider>,
  );

describe('AuthForm', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el error de validacion y no intenta autenticar con un correo invalido', async () => {
    const user = userEvent.setup();
    renderAuthForm();

    await user.type(screen.getByLabelText('Correo Electrónico'), 'correo invalido');
    await user.selectOptions(screen.getByLabelText('Empresa'), '1');
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    expect(await screen.findByText('Formato de correo inválido.')).toBeInTheDocument();
    expect(UsuarioService.login).not.toHaveBeenCalled();
  });
});
