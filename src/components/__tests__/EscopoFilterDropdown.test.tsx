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

function renderComponent(value = 'todas', onChange = vi.fn()) {
  return render(
    <EscopoFilterDropdown
      grupos={gruposMock}
      value={value}
      onChange={onChange}
    />
  )
}

describe('EscopoFilterDropdown', () => {
  it('deve abrir e fechar dropdown', () => {
    renderComponent()

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    expect(screen.getByPlaceholderText('Buscar unidade')).toBeInTheDocument()

    fireEvent.click(trigger)
    expect(screen.queryByPlaceholderText('Buscar unidade')).not.toBeInTheDocument()
  })

  it('deve filtrar unidades pelo input', () => {
    renderComponent()

    fireEvent.click(screen.getByRole('button'))

    const input = screen.getByPlaceholderText('Buscar unidade')
    fireEvent.change(input, { target: { value: 'A1' } })

    expect(screen.getByText('Escola A1')).toBeInTheDocument()
    expect(screen.queryByText('Escola A2')).not.toBeInTheDocument()
  })

  it('deve mostrar mensagem quando não houver resultados', () => {
    renderComponent()

    fireEvent.click(screen.getByRole('button'))

    fireEvent.change(screen.getByPlaceholderText('Buscar unidade'), {
      target: { value: 'inexistente' },
    })

    expect(screen.getByText('Nenhuma unidade encontrada')).toBeInTheDocument()
  })

  it('deve selecionar UO e chamar onChange', () => {
    const onChange = vi.fn()
    renderComponent('todas', onChange)

    // abre dropdown
    fireEvent.click(screen.getByRole('button'))

    // pega o container do dropdown
    const dropdown = screen.getByPlaceholderText('Buscar unidade').closest('div')!

    // busca dentro dele
    const uoButton = within(dropdown.parentElement!).getByRole('button', {
        name: 'Secretaria A',
    })

    fireEvent.click(uoButton)

    expect(onChange).toHaveBeenCalledWith('uo:1')
  })

  it('deve selecionar "Todas"', () => {
    const onChange = vi.fn()
    renderComponent('uo:1', onChange)

    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('button', { name: 'Todas' }))

    expect(onChange).toHaveBeenCalledWith('todas')
  })

  it('deve exibir label correta para UO selecionada', () => {
    renderComponent('uo:1')
    expect(screen.getByText('Secretaria A')).toBeInTheDocument()
  })

  it('deve exibir label correta para UA selecionada', () => {
    renderComponent('ua:100')
    expect(screen.getByText('Escola A1')).toBeInTheDocument()
  })

  it('deve exibir "Todas" quando value for "todas"', () => {
    renderComponent('todas')
    expect(screen.getByText('Todas')).toBeInTheDocument()
  })

  it('deve fechar ao clicar fora', () => {
    renderComponent()

    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByPlaceholderText('Buscar unidade')).toBeInTheDocument()

    fireEvent.mouseDown(document)

    expect(screen.queryByPlaceholderText('Buscar unidade')).not.toBeInTheDocument()
  })

  it('deve aplicar classe ativa para UO selecionada', () => {
    renderComponent('uo:1')

    fireEvent.click(screen.getByRole('button'))

    const dropdownButtons = screen.getAllByRole('button', {
      name: 'Secretaria A',
    })

    // O primeiro é o trigger, o segundo é o botão dentro do dropdown
    const dropdownButton = dropdownButtons[1]

    expect(dropdownButton).toHaveClass('bg-green-50')
  })

  it('deve aplicar classe ativa para UA selecionada', () => {
    renderComponent('ua:100')

    fireEvent.click(screen.getByRole('button'))

    const buttons = screen.getAllByRole('button', {
        name: 'Escola A1',
    })

    const dropdownButton = buttons[1]

    expect(dropdownButton).toHaveClass('bg-green-50')
  })
})