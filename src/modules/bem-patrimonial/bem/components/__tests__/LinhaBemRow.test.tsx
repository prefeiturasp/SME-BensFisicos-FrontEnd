import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LinhaBemRow } from '../LinhaBemRow'
import type { LinhaBem } from '../LinhaBemRow'

// Mock do hook
vi.mock('../../hooks/useNumeroPatrimonial', () => ({
  useNumeroPatrimonial: () => ({
    disabled: false,
    applyMask: (value: string) => `masked-${value}`,
    ativarFormatoAntigo: vi.fn(),
    desativarFormatoAntigo: vi.fn(),
    handleSemNumeracaoChange: vi.fn(),
  }),
}))

describe('LinhaBemRow', () => {
  const linhaBase: LinhaBem = {
    numero_patrimonial: '',
    numero_formato_antigo: false,
    sem_numeracao: false,
    localizacao: '',
  }

  let setLinhas: any
  let removeLinha: any
  let addLinha: any

  beforeEach(() => {
    setLinhas = vi.fn()
    removeLinha = vi.fn()
    addLinha = vi.fn()
    vi.clearAllMocks()
  })

  function renderComponent(customLinha?: Partial<LinhaBem>, isLast = true) {
    const linha = { ...linhaBase, ...customLinha }

    return render(
      <LinhaBemRow
        linha={linha}
        index={0}
        linhas={[linha]}
        setLinhas={setLinhas}
        removeLinha={removeLinha}
        addLinha={addLinha}
        isLast={isLast}
      />
    )
  }

  it('deve renderizar campos corretamente', () => {
    renderComponent()

    expect(
      screen.getByPlaceholderText('000.000000000-0')
    ).toBeInTheDocument()

    expect(
      screen.getByPlaceholderText('Localização')
    ).toBeInTheDocument()
  })

  it('deve aplicar máscara ao alterar número patrimonial', () => {
    renderComponent()

    fireEvent.change(
      screen.getByPlaceholderText('000.000000000-0'),
      { target: { value: '123' } }
    )

    expect(setLinhas).toHaveBeenCalled()
  })

  it('deve marcar formato anterior', () => {
    renderComponent()

    const checkbox = screen.getByLabelText('Formato anterior')
    fireEvent.click(checkbox)

    expect(setLinhas).toHaveBeenCalled()
  })

  it('deve marcar sem número e limpar campos', () => {
    renderComponent({
      numero_patrimonial: '123',
      numero_formato_antigo: true,
    })

    const checkbox = screen.getByLabelText('Sem número patrimonial')
    fireEvent.click(checkbox)

    expect(setLinhas).toHaveBeenCalled()
  })

  it('deve atualizar localização', () => {
    renderComponent()

    fireEvent.change(
      screen.getByPlaceholderText('Localização'),
      { target: { value: 'Sala 1' } }
    )

    expect(setLinhas).toHaveBeenCalled()
  })

  it('deve chamar removeLinha ao clicar na lixeira', () => {
    renderComponent()

    const removeButton = screen.getAllByRole('button')[0]
    fireEvent.click(removeButton)

    expect(removeLinha).toHaveBeenCalledWith(0)
  })

  it('deve chamar addLinha se for última linha', () => {
    renderComponent({}, true)

    const buttons = screen.getAllByRole('button')
    const addButton = buttons[1] // segundo botão é o +
    fireEvent.click(addButton)

    expect(addLinha).toHaveBeenCalled()
  })

  it('não deve mostrar botão + se não for última linha', () => {
    renderComponent({}, false)

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(1) // só lixeira
  })

  it('deve exibir erro de numero_patrimonial quando errors é fornecido', () => {
    render(
      <LinhaBemRow
        linha={linhaBase}
        index={0}
        linhas={[linhaBase]}
        setLinhas={setLinhas}
        removeLinha={removeLinha}
        addLinha={addLinha}
        isLast={true}
        errors={{ numero_patrimonial: 'Número inválido' }}
      />
    )

    expect(screen.getByText('Número inválido')).toBeInTheDocument()
  })

  it('não deve exibir mensagem de erro quando errors é undefined', () => {
    renderComponent()

    expect(screen.queryByText('Número inválido')).not.toBeInTheDocument()
  })

  it('não deve exibir mensagem de erro quando errors está vazio', () => {
    render(
      <LinhaBemRow
        linha={linhaBase}
        index={0}
        linhas={[linhaBase]}
        setLinhas={setLinhas}
        removeLinha={removeLinha}
        addLinha={addLinha}
        isLast={true}
        errors={{}}
      />
    )

    expect(screen.queryByText('Número inválido')).not.toBeInTheDocument()
    expect(screen.queryByText('Localização é obrigatória.')).not.toBeInTheDocument()
  })

  it('deve exibir erro de localizacao quando errors.localizacao é fornecido', () => {
    render(
      <LinhaBemRow
        linha={linhaBase}
        index={0}
        linhas={[linhaBase]}
        setLinhas={setLinhas}
        removeLinha={removeLinha}
        addLinha={addLinha}
        isLast={true}
        errors={{ localizacao: 'Localização é obrigatória.' }}
      />
    )

    expect(screen.getByText('Localização é obrigatória.')).toBeInTheDocument()
  })

  it('deve exibir label de Localização com asterisco obrigatório', () => {
    renderComponent()
    expect(screen.getByText('*')).toBeInTheDocument()
  })
})