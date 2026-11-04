import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConciliacaoItemSituacaoBadge } from '../ConciliacaoItemSituacaoBadge';

describe('ConciliacaoItemSituacaoBadge', () => {
  it('renderiza label "Encontrado sem divergência" para encontrado_sem_divergencia', () => {
    render(<ConciliacaoItemSituacaoBadge situacao='encontrado_sem_divergencia' />);
    expect(screen.getByTestId('item-situacao-encontrado_sem_divergencia')).toHaveTextContent(
      'Encontrado sem divergência',
    );
  });

  it('renderiza label "Não encontrado" para nao_encontrado', () => {
    render(<ConciliacaoItemSituacaoBadge situacao='nao_encontrado' />);
    expect(screen.getByTestId('item-situacao-nao_encontrado')).toHaveTextContent('Não encontrado');
  });

  it('renderiza label "Divergente" para divergente', () => {
    render(<ConciliacaoItemSituacaoBadge situacao='divergente' />);
    expect(screen.getByTestId('item-situacao-divergente')).toHaveTextContent('Divergente');
  });

  it('renderiza label "Em processo de baixa" para em_processo_de_baixa_fisica', () => {
    render(<ConciliacaoItemSituacaoBadge situacao='em_processo_de_baixa_fisica' />);
    expect(screen.getByTestId('item-situacao-em_processo_de_baixa_fisica')).toHaveTextContent(
      'Em processo de baixa',
    );
  });

  it('renderiza label "Baixa Física" para baixa_fisica', () => {
    render(<ConciliacaoItemSituacaoBadge situacao='baixa_fisica' />);
    expect(screen.getByTestId('item-situacao-baixa_fisica')).toHaveTextContent('Baixa Física');
  });

  it('renderiza label "Encontrado" para encontrado', () => {
    render(<ConciliacaoItemSituacaoBadge situacao='encontrado' />);
    expect(screen.getByTestId('item-situacao-encontrado')).toHaveTextContent('Encontrado');
  });
});
