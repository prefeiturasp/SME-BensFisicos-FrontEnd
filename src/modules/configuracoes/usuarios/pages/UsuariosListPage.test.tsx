import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import UsuariosListPage from './UsuariosListPage';

describe('UsuariosListPage', () => {

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <UsuariosListPage />
      </MemoryRouter>,
    );
  };

  it('deve renderizar o título da página', () => {
    renderComponent();

    expect(
      screen.getByRole('heading', { name: 'Usuários' })
    ).toBeInTheDocument();
  });

  it('deve renderizar o breadcrumb', () => {
    renderComponent();

    expect(screen.getByText('Configurações')).toBeInTheDocument();
    expect(screen.getByText('Usuários', { selector: 'span' })).toBeInTheDocument();
  });

  it('deve renderizar os botões principais', () => {
    renderComponent();

    expect(screen.getByText('Relatório')).toBeInTheDocument();
    expect(screen.getByText('Adicionar Usuário')).toBeInTheDocument();
  });

});