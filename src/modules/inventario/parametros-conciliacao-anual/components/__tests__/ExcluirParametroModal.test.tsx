import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExcluirParametroModal } from '../ExcluirParametroModal';
import type { ParametroConciliacaoAnual } from '../../types/parametros-conciliacao-anual.types';

const parametro: ParametroConciliacaoAnual = {
  id: 1,
  unidade_orcamentaria: 9,
  unidade_orcamentaria_codigo: '01.16.10',
  unidade_orcamentaria_nome: 'SECRETARIA MUNICIPAL DE EDUCACAO',
  unidade_orcamentaria_sigla: 'SME',
  ano_referencia: 2026,
  periodo_inicial: '2026-04-04',
  periodo_final: '2026-04-30',
  ativo: true,
  esta_vigente: true,
};

describe('ExcluirParametroModal', () => {
  it('exibe o parametro selecionado e confirma a exclusao', () => {
    const onConfirm = vi.fn();

    render(
      <ExcluirParametroModal
        parametro={parametro}
        deleting={false}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole('heading', { name: /Excluir/i })).toBeInTheDocument();
    expect(screen.getByText('2026 | 04/04/2026 - 30/04/2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('fecha pelo botao manter e pelo icone de fechar', () => {
    const onClose = vi.fn();

    render(
      <ExcluirParametroModal
        parametro={parametro}
        deleting={false}
        onClose={onClose}
        onConfirm={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Manter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
