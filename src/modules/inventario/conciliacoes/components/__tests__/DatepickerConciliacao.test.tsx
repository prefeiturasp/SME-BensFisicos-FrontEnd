import { startOfDay } from 'date-fns';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { DatepickerConciliacao } from '../DatepickerConciliacao';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
});

describe('DatepickerConciliacao', () => {
  it('parseia o valor inicial e formata a data selecionada de volta para dd/mm/aaaa', async () => {
    const onChange = vi.fn();
    render(
      <DatepickerConciliacao
        id='periodo-final'
        label='Período Final'
        value='31/12/2025'
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('button', { name: 'Selecionar data' })).toHaveTextContent(
      '31/12/2025',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar data' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Hoje' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    const [formatted] = onChange.mock.calls[0] as [string];
    expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('desabilita o botao de abertura quando disabled e true', () => {
    render(
      <DatepickerConciliacao
        id='periodo-final'
        label='Período Final'
        value=''
        onChange={vi.fn()}
        disabled
      />,
    );

    expect(screen.getByRole('button', { name: 'Selecionar data' })).toBeDisabled();
  });

  it('desabilita o botao Hoje quando o predicado bloqueia a data atual', async () => {
    const onChange = vi.fn();
    render(
      <DatepickerConciliacao
        id='periodo-final'
        label='Período Final'
        value=''
        onChange={onChange}
        disabled={(date) => date >= startOfDay(new Date())}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar data' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Hoje' })).toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
