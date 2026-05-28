import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ExcluirBemModal from '../ExcluirBemModal'

const bemMock = {
  id: 1,
  nome: 'Notebook Dell',
  numero_patrimonial: '123',
  descricao: 'Teste',
  status: 'aprovado',
  status_display: 'Aprovado',
  localizacao: 'Sala 1',
  unidade_administrativa_codigo: '001',
  unidade_administrativa_nome: 'Admin',
  unidade_orcamentaria_nome: 'Financeiro',
}

describe('ExcluirBemModal', () => {
  it('deve renderizar modal com informações do bem', () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()

    render(
      <ExcluirBemModal
        bem={bemMock}
        deleting={false}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )

    expect(screen.getByText('Excluir Bem Patrimonial')).toBeInTheDocument()
    expect(screen.getByText('123 | Notebook Dell')).toBeInTheDocument()
  })

  it('deve exibir "-" quando numero_patrimonial for nulo', () => {
    const bemSemNumero = { ...bemMock, numero_patrimonial: null }
    const onClose = vi.fn()
    const onConfirm = vi.fn()

    render(
      <ExcluirBemModal
        bem={bemSemNumero}
        deleting={false}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )

    expect(screen.getByText('- | Notebook Dell')).toBeInTheDocument()
  })

  it('deve chamar onClose ao clicar em "Manter"', () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()

    render(
      <ExcluirBemModal
        bem={bemMock}
        deleting={false}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )

    fireEvent.click(screen.getByText('Manter'))
    expect(onClose).toHaveBeenCalled()
  })

  it('deve chamar onConfirm ao clicar em "Excluir"', () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()

    render(
      <ExcluirBemModal
        bem={bemMock}
        deleting={false}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )

    fireEvent.click(screen.getByText('Excluir'))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('deve chamar onClose ao clicar no ícone de fechar', () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()

    render(
      <ExcluirBemModal
        bem={bemMock}
        deleting={false}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )

    const closeButton = screen.getByLabelText('Fechar')
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalled()
  })

  it('deve desabilitar botões quando deleting for true', () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()

    render(
      <ExcluirBemModal
        bem={bemMock}
        deleting={true}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )

    expect(screen.getByText('Manter')).toBeDisabled()
    expect(screen.getByText('Excluindo...')).toBeDisabled()
    expect(screen.getByLabelText('Fechar')).toBeDisabled()
  })

  it('deve exibir "Excluindo..." quando deleting for true', () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()

    render(
      <ExcluirBemModal
        bem={bemMock}
        deleting={true}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )

    expect(screen.getByText('Excluindo...')).toBeInTheDocument()
    expect(screen.queryByText('Excluir')).not.toBeInTheDocument()
  })
})
