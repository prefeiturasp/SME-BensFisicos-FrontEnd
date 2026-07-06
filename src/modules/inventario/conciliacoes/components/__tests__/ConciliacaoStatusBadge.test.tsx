import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConciliacaoStatusBadge } from '../ConciliacaoStatusBadge';

describe('ConciliacaoStatusBadge', () => {
  it('renderiza label "Aberta" para em_aberto', () => {
    render(<ConciliacaoStatusBadge status='em_aberto' />);
    expect(screen.getByTestId('conciliacao-status-em_aberto')).toHaveTextContent('Aberta');
  });

  it('renderiza label "Fechada" para fechado', () => {
    render(<ConciliacaoStatusBadge status='fechado' />);
    expect(screen.getByTestId('conciliacao-status-fechado')).toHaveTextContent('Fechada');
  });

  it('renderiza label longa para fechado_admin', () => {
    render(<ConciliacaoStatusBadge status='fechado_admin' />);
    expect(screen.getByTestId('conciliacao-status-fechado_admin')).toHaveTextContent(
      'Fechada pelo Administrador - Não Conciliado',
    );
  });
});
