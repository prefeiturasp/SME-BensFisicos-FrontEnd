import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SituacaoBadge } from '../SituacaoBadge';

describe('SituacaoBadge', () => {
  it('renderiza o label, data-testid e classes da situacao', () => {
    render(<SituacaoBadge situacao='divergente' />);

    const badge = screen.getByTestId('situacao-badge-divergente');
    expect(badge).toHaveTextContent('Divergente');
    expect(badge.className).toContain('bg-amber-50');
    expect(badge.className).toContain('text-amber-700');
  });

  it('aceita className extra', () => {
    render(<SituacaoBadge situacao='encontrado_sem_divergencia' className='custom-cls' />);

    const badge = screen.getByTestId('situacao-badge-encontrado_sem_divergencia');
    expect(badge.className).toContain('custom-cls');
  });
});
