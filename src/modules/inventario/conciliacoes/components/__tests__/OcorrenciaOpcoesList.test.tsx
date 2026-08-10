import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OcorrenciaOpcoesList } from '../OcorrenciaOpcoesList';

const opcoes = [
  { value: 'encontrado_sem_divergencia' as const, label: 'Encontrado sem divergência' },
  { value: 'encontrado' as const, label: 'Encontrado' },
  { value: 'nao_encontrado' as const, label: 'Não encontrado' },
  { value: 'divergente' as const, label: 'Divergente' },
  { value: 'em_processo_de_baixa_fisica' as const, label: 'Em processo de baixa' },
];

describe('OcorrenciaOpcoesList', () => {
  it('renderiza todas as opcoes como radios', () => {
    render(<OcorrenciaOpcoesList opcoes={opcoes} selected='' onSelect={vi.fn()} />);

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(opcoes.length);
    expect(screen.getByTestId('ocorrencia-opcao-encontrado_sem_divergencia')).toBeInTheDocument();
    expect(screen.getByTestId('ocorrencia-opcao-divergente')).toBeInTheDocument();
  });

  it('marca a opcao selecionada com aria-checked e data-selected', () => {
    render(
      <OcorrenciaOpcoesList
        opcoes={opcoes}
        selected='divergente'
        onSelect={vi.fn()}
      />,
    );

    const opcaoSelecionada = screen.getByTestId('ocorrencia-opcao-divergente');
    expect(opcaoSelecionada).toHaveAttribute('aria-checked', 'true');
    expect(opcaoSelecionada).toHaveAttribute('data-selected', 'true');

    const opcaoNaoSelecionada = screen.getByTestId('ocorrencia-opcao-encontrado');
    expect(opcaoNaoSelecionada).toHaveAttribute('aria-checked', 'false');
    expect(opcaoNaoSelecionada).toHaveAttribute('data-selected', 'false');
  });

  it('dispara onSelect com a situacao correta ao clicar', () => {
    const onSelect = vi.fn();
    render(<OcorrenciaOpcoesList opcoes={opcoes} selected='' onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId('ocorrencia-opcao-nao_encontrado'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('nao_encontrado');
  });

  it('desabilita todos os radios quando disabled e true', () => {
    render(
      <OcorrenciaOpcoesList
        opcoes={opcoes}
        selected=''
        onSelect={vi.fn()}
        disabled
      />,
    );

    for (const opcao of opcoes) {
      expect(screen.getByTestId(`ocorrencia-opcao-${opcao.value}`)).toBeDisabled();
    }
  });

  it('nao renderiza nada quando nao ha opcoes', () => {
    const { container } = render(
      <OcorrenciaOpcoesList opcoes={[]} selected='' onSelect={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
