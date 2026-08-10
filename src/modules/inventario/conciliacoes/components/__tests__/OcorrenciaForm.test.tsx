import { zodResolver } from '@hookform/resolvers/zod';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { OcorrenciaForm } from '../OcorrenciaForm';
import {
  ocorrenciaFormSchema,
  type OcorrenciaFormData,
} from '../../validators/ocorrencia-form.schema';
import type { ConciliacaoSituacaoDisponivel } from '../../types/conciliacoes.types';

const opcoes: ReadonlyArray<ConciliacaoSituacaoDisponivel> = [
  { value: 'encontrado', label: 'Encontrado' },
  { value: 'nao_encontrado', label: 'Não encontrado' },
  { value: 'divergente', label: 'Divergente' },
  { value: 'em_processo_de_baixa_fisica', label: 'Em processo de baixa' },
];

function FormHarness({
  situacaoAnterior = 'nao_encontrado' as const,
  mostrarMensagemCondicional = true,
  onFormReady,
}: Readonly<{
  situacaoAnterior?: 'divergente' | 'nao_encontrado' | 'encontrado_sem_divergencia' | 'em_processo_de_baixa_fisica';
  mostrarMensagemCondicional?: boolean;
  onFormReady?: (form: ReturnType<typeof useForm<OcorrenciaFormData>>) => void;
}>) {
  const form = useForm<OcorrenciaFormData>({
    resolver: zodResolver(ocorrenciaFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      situacao: '',
      divergencia: '',
      observacao: '',
    },
  });

  if (onFormReady) {
    onFormReady(form);
  }

  return (
    <OcorrenciaForm
      form={form}
      opcoes={opcoes as ConciliacaoSituacaoDisponivel[]}
      situacaoAnterior={situacaoAnterior}
      mostrarMensagemCondicional={mostrarMensagemCondicional}
    />
  );
}

describe('OcorrenciaForm', () => {
  it.each([
    { situacao: 'nao_encontrado' as const },
    { situacao: 'divergente' as const },
  ])('renderiza a mensagem condicional para $situacao', ({ situacao }) => {
    render(<FormHarness situacaoAnterior={situacao} />);

    expect(screen.getByTestId('ocorrencia-mensagem-condicional')).toBeInTheDocument();
    expect(screen.getByTestId('ocorrencia-mensagem-condicional')).toHaveAttribute(
      'data-situacao-anterior',
      situacao,
    );
  });

  it('nao renderiza mensagem condicional quando a situacao nao exige', () => {
    render(<FormHarness situacaoAnterior='encontrado_sem_divergencia' />);

    expect(screen.queryByTestId('ocorrencia-mensagem-condicional')).not.toBeInTheDocument();
  });

  it('renderiza as opcoes retornadas pelo endpoint', () => {
    render(<FormHarness />);

    expect(screen.getByTestId('ocorrencia-opcoes-list')).toBeInTheDocument();
    for (const op of opcoes) {
      expect(screen.getByTestId(`ocorrencia-opcao-${op.value}`)).toBeInTheDocument();
    }
  });

  it('exibe campo de observacao por padrao', () => {
    render(<FormHarness />);

    expect(screen.getByTestId('ocorrencia-observacao')).toBeInTheDocument();
    expect(screen.queryByTestId('ocorrencia-descricao-divergencia')).not.toBeInTheDocument();
  });

  it('troca para "Descrição da Divergência" ao selecionar a opcao divergente', () => {
    render(<FormHarness />);

    fireEvent.click(screen.getByTestId('ocorrencia-opcao-divergente'));

    expect(screen.getByTestId('ocorrencia-descricao-divergencia')).toBeInTheDocument();
    expect(screen.queryByTestId('ocorrencia-observacao')).not.toBeInTheDocument();
  });

  it('volta a exibir "Observação" ao trocar de divergente para outra opcao', () => {
    render(<FormHarness />);

    fireEvent.click(screen.getByTestId('ocorrencia-opcao-divergente'));
    expect(screen.getByTestId('ocorrencia-descricao-divergencia')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('ocorrencia-opcao-encontrado'));

    expect(screen.getByTestId('ocorrencia-observacao')).toBeInTheDocument();
    expect(screen.queryByTestId('ocorrencia-descricao-divergencia')).not.toBeInTheDocument();
  });

  it('mostra erro de validacao quando "divergente" sem descricao e enviado', async () => {
    let captured: ReturnType<typeof useForm<OcorrenciaFormData>> | null = null;
    const onFormReady = (form: ReturnType<typeof useForm<OcorrenciaFormData>>) => {
      captured = form;
    };

    render(<FormHarness onFormReady={onFormReady} />);

    fireEvent.click(screen.getByTestId('ocorrencia-opcao-divergente'));

    await waitFor(() => {
      expect(captured).not.toBeNull();
    });

    await captured!.handleSubmit(() => undefined)();

    await waitFor(() => {
      expect(screen.getByText('Descreva a divergência encontrada.')).toBeInTheDocument();
    });
  });

  it('limpa a observacao ao trocar para "divergente"', () => {
    let captured: ReturnType<typeof useForm<OcorrenciaFormData>> | null = null;
    const onFormReady = (form: ReturnType<typeof useForm<OcorrenciaFormData>>) => {
      captured = form;
    };

    render(<FormHarness onFormReady={onFormReady} />);

    fireEvent.change(screen.getByTestId('ocorrencia-observacao'), {
      target: { value: 'observacao antiga' },
    });
    fireEvent.click(screen.getByTestId('ocorrencia-opcao-divergente'));

    expect(
      (screen.getByTestId('ocorrencia-descricao-divergencia') as HTMLTextAreaElement)
        .value,
    ).toBe('');

    expect(captured).not.toBeNull();
    expect(captured!.getValues('observacao')).toBe('');
  });

  it('limpa a descricao de divergencia ao trocar para uma opcao nao divergente', () => {
    let captured: ReturnType<typeof useForm<OcorrenciaFormData>> | null = null;
    const onFormReady = (form: ReturnType<typeof useForm<OcorrenciaFormData>>) => {
      captured = form;
    };

    render(<FormHarness onFormReady={onFormReady} />);

    fireEvent.click(screen.getByTestId('ocorrencia-opcao-divergente'));
    fireEvent.change(screen.getByTestId('ocorrencia-descricao-divergencia'), {
      target: { value: 'detalhes antigos' },
    });
    fireEvent.click(screen.getByTestId('ocorrencia-opcao-encontrado'));

    expect((screen.getByTestId('ocorrencia-observacao') as HTMLTextAreaElement).value).toBe('');

    expect(captured).not.toBeNull();
    expect(captured!.getValues('divergencia')).toBe('');
  });

  it('omite a mensagem condicional quando mostrarMensagemCondicional = false', () => {
    render(
      <FormHarness
        situacaoAnterior='divergente'
        mostrarMensagemCondicional={false}
      />,
    );

    expect(
      screen.queryByTestId('ocorrencia-mensagem-condicional'),
    ).not.toBeInTheDocument();
  });
});
