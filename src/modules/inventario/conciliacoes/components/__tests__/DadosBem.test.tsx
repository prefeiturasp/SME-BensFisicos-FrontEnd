import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DadosBem } from '../DadosBem';
import type { ConciliacaoItemBem } from '../../types/conciliacoes.types';

const bem: ConciliacaoItemBem = {
  id: 123,
  numero_patrimonial: '001.0002/2026/005',
  nome: '00.00.00.002 - COTIC',
  descricao: '',
  marca: '',
  modelo: '',
  valor_unitario: '0',
  status: 'ativo',
  localizacao: '',
  bloqueado_conciliacao: false,
};

describe('DadosBem', () => {
  it('renderiza os campos do bem em modo somente leitura', () => {
    render(
      <DadosBem
        numeroPatrimonial={bem.numero_patrimonial}
        nome={bem.nome}
        situacao='nao_encontrado'
        bem={bem}
      />,
    );

    const numeroInput = screen.getByLabelText('Número Patrimonial') as HTMLInputElement;
    const nomeInput = screen.getByLabelText('Nome do bem') as HTMLInputElement;

    expect(numeroInput.value).toBe('001.0002/2026/005');
    expect(numeroInput).toBeDisabled();
    expect(nomeInput.value).toBe('00.00.00.002 - COTIC');
    expect(nomeInput).toBeDisabled();
  });

  it('exibe badge com a situacao atual', () => {
    render(
      <DadosBem
        numeroPatrimonial={bem.numero_patrimonial}
        nome={bem.nome}
        situacao='nao_encontrado'
        bem={bem}
      />,
    );

    expect(screen.getByTestId('item-situacao-nao_encontrado')).toBeInTheDocument();
  });

  it('exibe "Divergência" quando a situacao e divergente e existe divergencia', () => {
    render(
      <DadosBem
        numeroPatrimonial={bem.numero_patrimonial}
        nome={bem.nome}
        situacao='divergente'
        observacao='observacao qualquer'
        divergencia='mudar a marca'
        bem={bem}
      />,
    );

    const wrapper = screen.getByTestId('dados-bem-divergencia');
    expect(wrapper).toHaveTextContent('mudar a marca');
    expect(screen.queryByTestId('dados-bem-observacao')).not.toBeInTheDocument();
  });

  it('exibe "Observação" quando a situacao e diferente de divergente', () => {
    render(
      <DadosBem
        numeroPatrimonial={bem.numero_patrimonial}
        nome={bem.nome}
        situacao='nao_encontrado'
        observacao='item não encontrado'
        divergencia=''
        bem={bem}
      />,
    );

    const wrapper = screen.getByTestId('dados-bem-observacao');
    expect(wrapper).toHaveTextContent('item não encontrado');
    expect(screen.queryByTestId('dados-bem-divergencia')).not.toBeInTheDocument();
  });

  it('exibe hifen quando nao ha observacao nem divergencia', () => {
    render(
      <DadosBem
        numeroPatrimonial={bem.numero_patrimonial}
        nome={bem.nome}
        situacao='encontrado_sem_divergencia'
        bem={bem}
      />,
    );

    expect(screen.getByTestId('dados-bem-observacao')).toHaveTextContent('-');
  });
});
