import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { EscopoFilterDropdown } from '../EscopoFilterDropdown'

const gruposMock = [
  {
    uo: { id: 1, label: 'Secretaria A' },
    uas: [
      {
        id: 10,
        unidade_administrativa_id: 100,
        label: 'Escola A1',
      },
      {
        id: 11,
        unidade_administrativa_id: 101,
        label: 'Escola A2',
      },
    ],
  },
  {
    uo: { id: 2, label: 'Secretaria B' },
    uas: [],
  },
]

function renderComponent(value: string[] = [], onChange = vi.fn()) {
  return render(
    <EscopoFilterDropdown grupos={gruposMock} value={value} onChange={onChange} />,
  )
}

describe('EscopoFilterDropdown', () => {
  it('deve abrir e fechar dropdown', () => {
    renderComponent()

    const trigger = screen.getByRole('button', { name: /Todas as UAs/i })
    fireEvent.click(trigger)

    expect(screen.getByPlaceholderText('Buscar unidade')).toBeInTheDocument()

    fireEvent.click(trigger)
    expect(
      screen.queryByPlaceholderText('Buscar unidade'),
    ).not.toBeInTheDocument()
  })

  it('deve filtrar unidades pelo input', () => {
    renderComponent()

    fireEvent.click(screen.getByRole('button', { name: /Todas as UAs/i }))

    const input = screen.getByPlaceholderText('Buscar unidade')
    fireEvent.change(input, { target: { value: 'A1' } })

    expect(screen.getByText('Escola A1')).toBeInTheDocument()
    expect(screen.queryByText('Escola A2')).not.toBeInTheDocument()
  })

  it('deve mostrar mensagem quando não houver resultados', () => {
    renderComponent()

    fireEvent.click(screen.getByRole('button', { name: /Todas as UAs/i }))

    fireEvent.change(screen.getByPlaceholderText('Buscar unidade'), {
      target: { value: 'inexistente' },
    })

    expect(screen.getByText('Nenhuma unidade encontrada')).toBeInTheDocument()
  })

  it('deve selecionar uma UA individual e chamar onChange com o id', () => {
    const onChange = vi.fn()
    renderComponent([], onChange)

    fireEvent.click(screen.getByRole('button', { name: /Todas as UAs/i }))

    fireEvent.click(screen.getByText('Escola A1'))

    expect(onChange).toHaveBeenCalledWith(['100'])
  })

  it('deve desmarcar uma UA já selecionada', () => {
    const onChange = vi.fn()
    renderComponent(['100'], onChange)

    // trigger exibe o label da UA única selecionada
    fireEvent.click(screen.getByRole('button', { name: 'Escola A1' }))

    const painel = screen
      .getByPlaceholderText('Buscar unidade')
      .closest('div')!.parentElement!

    fireEvent.click(within(painel).getByText('Escola A1'))

    expect(onChange).toHaveBeenCalledWith([])
  })

  it('deve marcar todas as UAs da UO ao clicar no grupo', () => {
    const onChange = vi.fn()
    renderComponent([], onChange)

    fireEvent.click(screen.getByRole('button', { name: /Todas as UAs/i }))

    const dropdown = screen
      .getByPlaceholderText('Buscar unidade')
      .closest('div')!.parentElement!

    fireEvent.click(within(dropdown).getByText('Secretaria A'))

    expect(onChange).toHaveBeenCalledWith(['100', '101'])
  })

  it('deve selecionar "Todas as UAs" limpando a seleção', () => {
    const onChange = vi.fn()
    renderComponent(['100'], onChange)

    // trigger exibe o label da UA única selecionada
    fireEvent.click(screen.getByRole('button', { name: 'Escola A1' }))

    const painel = screen
      .getByPlaceholderText('Buscar unidade')
      .closest('div')!.parentElement!

    fireEvent.click(within(painel).getByText('Todas as UAs'))

    expect(onChange).toHaveBeenCalledWith([])
  })

  it('deve exibir "Todas as UAs" quando nenhuma UA estiver selecionada', () => {
    renderComponent([])
    expect(screen.getByText('Todas as UAs')).toBeInTheDocument()
  })

  it('deve exibir label da UA quando apenas uma estiver selecionada', () => {
    renderComponent(['100'])
    expect(screen.getByText('Escola A1')).toBeInTheDocument()
  })

  it('deve exibir contagem quando múltiplas UAs estiverem selecionadas', () => {
    renderComponent(['100', '101'])
    expect(screen.getByText('2 unidades selecionadas')).toBeInTheDocument()
  })

  it('deve fechar ao clicar fora', () => {
    renderComponent()

    fireEvent.click(screen.getByRole('button', { name: /Todas as UAs/i }))
    expect(screen.getByPlaceholderText('Buscar unidade')).toBeInTheDocument()

    fireEvent.mouseDown(document)

    expect(
      screen.queryByPlaceholderText('Buscar unidade'),
    ).not.toBeInTheDocument()
  })

  it('deve aplicar destaque visual para UA selecionada', () => {
    renderComponent(['100'])

    fireEvent.click(screen.getByRole('button', { name: 'Escola A1' }))

    const painel = screen
      .getByPlaceholderText('Buscar unidade')
      .closest('div')!.parentElement!

    const label = within(painel).getByText('Escola A1').closest('label')!
    expect(label).toHaveClass('bg-green-50')
  })
})