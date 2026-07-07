import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConciliacaoTipoBadge } from '../ConciliacaoTipoBadge';

describe('ConciliacaoTipoBadge', () => {
  it('renderiza label "Anual" para tipo anual', () => {
    render(<ConciliacaoTipoBadge tipo='anual' />);
    expect(screen.getByTestId('conciliacao-tipo-anual')).toHaveTextContent('Anual');
  });

  it('renderiza label "Eventual" para tipo eventual', () => {
    render(<ConciliacaoTipoBadge tipo='eventual' />);
    expect(screen.getByTestId('conciliacao-tipo-eventual')).toHaveTextContent('Eventual');
  });
});
