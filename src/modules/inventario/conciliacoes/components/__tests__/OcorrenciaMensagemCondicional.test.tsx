import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OcorrenciaMensagemCondicional } from '../OcorrenciaMensagemCondicional';

describe('OcorrenciaMensagemCondicional', () => {
  it('nao renderiza nada quando a situacao nao exige mensagem', () => {
    const { container } = render(
      <OcorrenciaMensagemCondicional situacaoAnterior='encontrado_sem_divergencia' />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza mensagem especifica para situacao "divergente"', () => {
    render(<OcorrenciaMensagemCondicional situacaoAnterior='divergente' />);

    const mensagem = screen.getByTestId('ocorrencia-mensagem-condicional');
    expect(mensagem).toHaveAttribute('data-situacao-anterior', 'divergente');
    expect(mensagem).toHaveTextContent(
      'Este bem foi marcado como "Divergente" no inventário anterior. Selecione "Encontrado sem divergência" se a divergência foi corrigida.',
    );
  });

  it('renderiza mensagem especifica para situacao "nao_encontrado"', () => {
    render(<OcorrenciaMensagemCondicional situacaoAnterior='nao_encontrado' />);

    const mensagem = screen.getByTestId('ocorrencia-mensagem-condicional');
    expect(mensagem).toHaveAttribute('data-situacao-anterior', 'nao_encontrado');
    expect(mensagem).toHaveTextContent(
      'A opção "Encontrado" está disponível pois o bem estava marcado como "Não encontrado" no inventário anterior.',
    );
  });

  it('nao renderiza nada quando mostrar = false mesmo que a situacao exija mensagem', () => {
    const { container } = render(
      <OcorrenciaMensagemCondicional
        situacaoAnterior='divergente'
        mostrar={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
