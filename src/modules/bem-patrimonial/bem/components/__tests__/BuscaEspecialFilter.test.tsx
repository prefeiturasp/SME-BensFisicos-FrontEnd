import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BuscaEspecialFilter } from '../BuscaEspecialFilter'

describe('BuscaEspecialFilter', () => {
  const setup = (overrides = {}) => {
    const onChangeBuscaGeralUos = vi.fn()
    const onChangeBensBaixados = vi.fn()

    render(
      <BuscaEspecialFilter
        id='busca-especial'
        buscaGeralUos={false}
        bensBaixados={false}
        onChangeBuscaGeralUos={onChangeBuscaGeralUos}
        onChangeBensBaixados={onChangeBensBaixados}
        {...overrides}
      />
    )

    return { onChangeBuscaGeralUos, onChangeBensBaixados }
  }

  it('renderiza o trigger com o id informado', () => {
    setup()
    expect(document.getElementById('busca-especial')).toBeInTheDocument()
  })

  it('não exibe as opções antes de abrir o dropdown', () => {
    setup()
    expect(
      screen.queryByText('Busca geral em todas as UOs')
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Bens Baixados')).not.toBeInTheDocument()
  })

  it('exibe as opções ao clicar no trigger', () => {
    setup()
    fireEvent.click(screen.getByRole('button'))

    expect(
      screen.getByText('Busca geral em todas as UOs')
    ).toBeInTheDocument()
    expect(screen.getByText('Bens Baixados')).toBeInTheDocument()
  })

  it('chama onChangeBuscaGeralUos ao marcar a opção', () => {
    const { onChangeBuscaGeralUos } = setup()
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('Busca geral em todas as UOs'))

    expect(onChangeBuscaGeralUos).toHaveBeenCalledWith(true)
  })

  it('chama onChangeBensBaixados ao marcar a opção', () => {
    const { onChangeBensBaixados } = setup()
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('Bens Baixados'))

    expect(onChangeBensBaixados).toHaveBeenCalledWith(true)
  })

  it('exibe contagem de selecionados quando houver opções marcadas', () => {
    setup({ buscaGeralUos: true, bensBaixados: true })
    expect(screen.getByText('2 selecionado(s)')).toBeInTheDocument()
  })

  it('fecha o dropdown ao pressionar Escape', () => {
    setup()
    fireEvent.click(screen.getByRole('button'))
    expect(
      screen.getByText('Busca geral em todas as UOs')
    ).toBeInTheDocument()

    fireEvent.keyDown(screen.getByText('Busca geral em todas as UOs'), {
      key: 'Escape',
      code: 'Escape',
    })

    expect(
      screen.queryByText('Busca geral em todas as UOs')
    ).not.toBeInTheDocument()
  })
})