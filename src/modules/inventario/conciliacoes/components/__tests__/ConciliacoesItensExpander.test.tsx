import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConciliacoesItensExpander } from '../ConciliacoesItensExpander';
import type { ConciliacaoResumoSituacoes } from '../../types/conciliacoes.types';

const resumo: ConciliacaoResumoSituacoes = {
  encontrados: 1,
  nao_encontrados: 3,
  divergentes: 3,
  em_processo_baixa: 3,
  baixa_fisica: 1,
  encontrados_com_divergencia: 0,
};

interface HarnessProps {
  totalItens: number;
  resumo: ConciliacaoResumoSituacoes;
  conciliacaoId?: number;
  initialOpen?: boolean;
}

function Harness({
  totalItens,
  resumo,
  conciliacaoId = 1,
  initialOpen = false,
}: Readonly<HarnessProps>) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <>
      <button type='button' onClick={() => setOpen(false)} data-testid='external-close'>
        fechar de fora
      </button>
      <ConciliacoesItensExpander
        conciliacaoId={conciliacaoId}
        totalItens={totalItens}
        resumo={resumo}
        isOpen={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

describe('ConciliacoesItensExpander', () => {
  it('renderiza o total de itens no trigger', () => {
    render(<Harness totalItens={11} resumo={resumo} />);

    expect(screen.getByTestId('conciliacoes-itens-trigger')).toHaveTextContent('11 itens');
  });

  it('exibe o resumo de situacoes quando expandido', async () => {
    render(<Harness totalItens={11} resumo={resumo} />);

    fireEvent.click(screen.getByTestId('conciliacoes-itens-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('conciliacoes-itens-row-encontrados')).toBeInTheDocument();
    });

    expect(screen.getByTestId('conciliacoes-itens-row-encontrados')).toHaveTextContent('1');
    expect(screen.getByTestId('conciliacoes-itens-row-nao_encontrados')).toHaveTextContent('3');
    expect(screen.getByTestId('conciliacoes-itens-row-divergentes')).toHaveTextContent('3');
    expect(screen.getByTestId('conciliacoes-itens-row-em_processo_baixa')).toHaveTextContent('3');
    expect(screen.getByTestId('conciliacoes-itens-row-baixa_fisica')).toHaveTextContent('1');
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
  });

  it('fecha o card ao clicar fora', async () => {
    render(<Harness totalItens={11} resumo={resumo} initialOpen />);

    expect(screen.getByTestId('conciliacoes-itens-row-encontrados')).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByTestId('external-close'));
    fireEvent.click(screen.getByTestId('external-close'));

    await waitFor(() => {
      expect(screen.queryByTestId('conciliacoes-itens-row-encontrados')).not.toBeInTheDocument();
    });
  });

  it('renderiza zero para todas as situacoes quando totalItens e zero', async () => {
    const emptyResumo: ConciliacaoResumoSituacoes = {
      encontrados: 0,
      nao_encontrados: 0,
      divergentes: 0,
      em_processo_baixa: 0,
      baixa_fisica: 0,
      encontrados_com_divergencia: 0,
    };

    render(<Harness totalItens={0} resumo={emptyResumo} />);

    fireEvent.click(screen.getByTestId('conciliacoes-itens-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('conciliacoes-itens-row-encontrados')).toBeInTheDocument();
    });

    expect(screen.getByTestId('conciliacoes-itens-row-encontrados')).toHaveTextContent('0');
    expect(screen.getByTestId('conciliacoes-itens-row-baixa_fisica')).toHaveTextContent('0');
  });
});
