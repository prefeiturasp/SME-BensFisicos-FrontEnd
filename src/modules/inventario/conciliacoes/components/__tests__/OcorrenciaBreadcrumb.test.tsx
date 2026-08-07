import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { OcorrenciaBreadcrumb } from '../OcorrenciaBreadcrumb';

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <OcorrenciaBreadcrumb conciliacaoId={1} itemId={42} />
    </MemoryRouter>,
  );
}

describe('OcorrenciaBreadcrumb', () => {
  it('renderiza a trilha com Início, Inventário, Conciliação e Registrar Ocorrência', () => {
    renderWithRouter();

    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Inventário')).toBeInTheDocument();
    expect(screen.getByText('Gerenciamento de Conciliações')).toBeInTheDocument();
    expect(screen.getByText('Detalhes da Conciliação')).toBeInTheDocument();
    expect(screen.getByText('Registrar Ocorrência')).toBeInTheDocument();
    expect(screen.queryByText('Item')).not.toBeInTheDocument();
  });

  it('marca o item "Registrar Ocorrência" como ativo', () => {
    renderWithRouter();

    const active = screen.getByText('Registrar Ocorrência');
    expect(active).toHaveAttribute('aria-current', 'page');
  });

  it('gera links de retorno para a conciliacao e gerenciamento', () => {
    renderWithRouter();

    const conciliacaoLink = screen.getByText('Detalhes da Conciliação').closest('a');
    const gerenciamentoLink = screen
      .getByText('Gerenciamento de Conciliações')
      .closest('a');

    expect(conciliacaoLink).toHaveAttribute('href', '/conciliacoes/1');
    expect(gerenciamentoLink).toHaveAttribute('href', '/conciliacoes');
  });
});
