import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { createMemoryRouter, Outlet, RouterProvider, useNavigate } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { UnsavedChangesProvider } from './UnsavedChangesProvider';
import { useUnsavedChanges } from './useUnsavedChanges';

function GuardedForm() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [fullReloadAllowed, setFullReloadAllowed] = useState(false);
  const { navigateAfterSave } = useUnsavedChanges(Boolean(value), 'create');

  return (
    <div>
      <label htmlFor='name'>Nome</label>
      <input id='name' value={value} onChange={(event) => setValue(event.target.value)} />
      <button type='button' onClick={() => navigate('/other')}>
        Cancelar
      </button>
      <button type='button' onClick={() => navigateAfterSave(() => navigate('/saved'))}>
        Salvar
      </button>
      <button
        type='button'
        onClick={() =>
          navigateAfterSave(() => {
            const event = new Event('beforeunload', { cancelable: true });
            globalThis.dispatchEvent(event);
            setFullReloadAllowed(!event.defaultPrevented);
          })
        }
      >
        Salvar e recarregar
      </button>
      {fullReloadAllowed && <span>Recarregamento liberado</span>}
    </div>
  );
}

function GuardedSelection() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(false);
  useUnsavedChanges(selected, 'selection');

  return (
    <div>
      <label><input type='checkbox' onChange={(event) => setSelected(event.target.checked)} />Item</label>
      <button type='button' onClick={() => navigate('/other')}>Sair</button>
    </div>
  );
}

function renderGuardedForm() {
  const router = createMemoryRouter(
    [
      {
        element: (
          <UnsavedChangesProvider>
            <Outlet />
          </UnsavedChangesProvider>
        ),
        children: [
          { path: '/', element: <GuardedForm /> },
          { path: '/other', element: <div>Outra página</div> },
          { path: '/saved', element: <div>Dados salvos</div> },
        ],
      },
    ],
    { initialEntries: ['/'] },
  );

  render(<RouterProvider router={router} />);
  return router;
}

describe('UnsavedChangesProvider', () => {
  it('permite sair diretamente quando não há alterações', async () => {
    renderGuardedForm();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByText('Outra página')).toBeInTheDocument();
    expect(screen.queryByText('Sair sem salvar?')).not.toBeInTheDocument();
  });

  it('mantém os dados ao continuar editando e permite descartá-los depois', async () => {
    renderGuardedForm();
    const input = screen.getByLabelText('Nome');
    await userEvent.type(input, 'Cadeira');

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByText('Sair sem salvar?')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Continuar preenchendo' }));
    expect(input).toHaveValue('Cadeira');

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Descartar e sair' }));
    expect(await screen.findByText('Outra página')).toBeInTheDocument();
  });

  it('não bloqueia o redirecionamento autorizado depois de salvar', async () => {
    renderGuardedForm();
    await userEvent.type(screen.getByLabelText('Nome'), 'Mesa');

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Dados salvos')).toBeInTheDocument();
    expect(screen.queryByText('Sair sem salvar?')).not.toBeInTheDocument();
  });

  it('não bloqueia o recarregamento autorizado depois de salvar', async () => {
    renderGuardedForm();
    await userEvent.type(screen.getByLabelText('Nome'), 'Armário');

    await userEvent.click(screen.getByRole('button', { name: 'Salvar e recarregar' }));

    expect(screen.getByText('Recarregamento liberado')).toBeInTheDocument();
  });

  it('deixa de bloquear quando o valor volta ao estado inicial', async () => {
    renderGuardedForm();
    const input = screen.getByLabelText('Nome');
    await userEvent.type(input, 'Mesa');
    await userEvent.clear(input);

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByText('Outra página')).toBeInTheDocument();
    expect(screen.queryByText('Sair sem salvar?')).not.toBeInTheDocument();
  });

  it('protege o descarregamento da página quando há alterações', async () => {
    renderGuardedForm();
    await userEvent.type(screen.getByLabelText('Nome'), 'Armário');

    const event = new Event('beforeunload', { cancelable: true });
    fireEvent(globalThis, event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('usa o texto específico ao abandonar uma seleção', async () => {
    const router = createMemoryRouter(
      [{
        element: <UnsavedChangesProvider><Outlet /></UnsavedChangesProvider>,
        children: [
          { path: '/', element: <GuardedSelection /> },
          { path: '/other', element: <div>Outra página</div> },
        ],
      }],
      { initialEntries: ['/'] },
    );
    render(<RouterProvider router={router} />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Item' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }));

    expect(screen.getByText('Descartar seleção?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manter seleção' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Descartar seleção' })).toBeInTheDocument();
  });
});
