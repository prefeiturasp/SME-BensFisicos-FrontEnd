import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UnidadesOrcamentariasActions } from '../UnidadesOrcamentariasActions';

function renderAcoes(props?: Partial<ComponentProps<typeof UnidadesOrcamentariasActions>>) {
  const onBack = vi.fn();
  const onAdd = vi.fn();
  const onReport = vi.fn();

  render(
    <UnidadesOrcamentariasActions
      reportLoading={false}
      onBack={onBack}
      onAdd={onAdd}
      onReport={onReport}
      {...props}
    />,
  );

  return { onBack, onAdd, onReport };
}

describe('UnidadesOrcamentariasActions', () => {
  it('renderiza botão Voltar e dispara callback', () => {
    const { onBack } = renderAcoes();

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('dispara callback de adicionar unidade', () => {
    const { onAdd } = renderAcoes();

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Unidade Orçamentária' }));

    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('abre menu de relatório e exporta no formato selecionado', () => {
    const { onReport } = renderAcoes();

    fireEvent.click(screen.getByRole('button', { name: 'Relatório' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Exportar CSV' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Exportar XLS' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Exportar XLSX' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Exportar PDF' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Exportar XLS' }));

    expect(onReport).toHaveBeenCalledWith('xls');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('fecha menu ao clicar fora e ao pressionar Escape', () => {
    renderAcoes();

    fireEvent.click(screen.getByRole('button', { name: 'Relatório' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('menu'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Enter' });
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Relatório' }));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('desabilita relatório durante geração e não abre menu', () => {
    renderAcoes({ reportLoading: true });

    const botaoRelatorio = screen.getByRole('button', { name: 'Relatório' });

    expect(screen.getByText('Gerando...')).toBeInTheDocument();
    expect(botaoRelatorio).toBeDisabled();

    fireEvent.click(botaoRelatorio);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});