import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { BemCadastroPageShell } from '../BemCadastroPageShell'

function renderShell(props: Partial<React.ComponentProps<typeof BemCadastroPageShell>> = {}) {
  return render(
    <MemoryRouter>
      <BemCadastroPageShell
        breadcrumbItems={[{ label: 'Bem Patrimonial', isActive: true }]}
        title='Adicionar Bem'
        onCancel={vi.fn()}
        onSave={vi.fn()}
        submitting={false}
        {...props}
      >
        <p>conteúdo</p>
      </BemCadastroPageShell>
    </MemoryRouter>,
  )
}

describe('BemCadastroPageShell', () => {
  it('mantém o botão Salvar habilitado com pendências de campo', () => {
    renderShell()

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled()
  })

  it('bloqueia o botão durante o envio para evitar submissão duplicada', () => {
    const onSave = vi.fn()
    renderShell({ submitting: true, onSave })

    const botao = screen.getByRole('button', { name: 'Salvando...' })
    expect(botao).toBeDisabled()

    botao.click()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('exibe o erro de servidor no topo', () => {
    renderShell({ error: 'Falha ao salvar' })

    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao salvar')
  })
})
