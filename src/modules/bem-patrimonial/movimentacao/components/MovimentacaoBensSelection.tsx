import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { MovimentacaoBemBusca } from '../types/movimentacao.types'

export type SelecaoMovimentacao =
  | { id: string; tipo: 'individual'; bens: MovimentacaoBemBusca[] }
  | {
      id: string
      tipo: 'faixa'
      numeroDe: string
      numeroAte: string
      bens: MovimentacaoBemBusca[]
    }
  | { id: string; tipo: 'todos'; bens: MovimentacaoBemBusca[] }

type Props = Readonly<{
  resultados: MovimentacaoBemBusca[]
  selecoes: SelecaoMovimentacao[]
  buscaRealizada: boolean
  totalResultados: number
  buscando: boolean
  proximaPagina: number | null
  permiteImportarFaixa: boolean
  permiteSelecionarResultados: boolean
  onAlternarBem: (bem: MovimentacaoBemBusca) => void
  onAlternarResultados: () => void
  onImportarFaixa: () => void
  onCarregarMais: (pagina: number) => void
  onRemoverSelecao: (id: string) => void
}>

function idsSelecionados(selecoes: SelecaoMovimentacao[]) {
  return new Set(selecoes.flatMap((selecao) => selecao.bens.map((bem) => bem.id)))
}

function idsBloqueados(selecoes: SelecaoMovimentacao[]) {
  return new Set(
    selecoes
      .filter((selecao) => selecao.tipo !== 'individual')
      .flatMap((selecao) => selecao.bens.map((bem) => bem.id)),
  )
}

function identificacaoSelecao(selecao: SelecaoMovimentacao) {
  if (selecao.tipo === 'todos') return 'Todos os bens aptos da UA de origem'
  if (selecao.tipo === 'faixa') {
    return selecao.numeroAte && selecao.numeroAte !== selecao.numeroDe
      ? `${selecao.numeroDe} até ${selecao.numeroAte}`
      : selecao.numeroDe
  }
  const bem = selecao.bens[0]
  return bem.numero_patrimonial ?? `ID ${bem.id}`
}

function nomesSelecao(selecao: SelecaoMovimentacao) {
  if (selecao.tipo === 'todos') return `${selecao.bens.length} bem(ns) selecionado(s)`
  return selecao.bens.map((bem) => bem.nome).join(', ')
}

export function MovimentacaoBensSelection({
  resultados,
  selecoes,
  buscaRealizada,
  totalResultados,
  buscando,
  proximaPagina,
  permiteImportarFaixa,
  permiteSelecionarResultados,
  onAlternarBem,
  onAlternarResultados,
  onImportarFaixa,
  onCarregarMais,
  onRemoverSelecao,
}: Props) {
  const selecionados = idsSelecionados(selecoes)
  const bloqueados = idsBloqueados(selecoes)
  const selecionaveis = permiteSelecionarResultados
    ? resultados.filter((bem) => bem.apto && !bloqueados.has(bem.id))
    : []
  const todosResultadosSelecionados =
    selecionaveis.length > 0 && selecionaveis.every((bem) => selecionados.has(bem.id))
  const algunsResultadosSelecionados =
    !todosResultadosSelecionados && selecionaveis.some((bem) => selecionados.has(bem.id))

  return (
    <div className='space-y-5'>
      {buscaRealizada && totalResultados === 0 ? (
        <p className='text-sm text-gray-500'>Nenhum bem encontrado para a busca informada.</p>
      ) : null}

      <div className='space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <p className='text-sm font-semibold text-gray-700'>Resultados da Busca ({totalResultados})</p>
          {permiteImportarFaixa && totalResultados > 0 ? (
            <Button
              type='button'
              onClick={onImportarFaixa}
              disabled={buscando}
              className='h-10 bg-[#2F7D57] px-5 font-semibold text-white hover:bg-[#256947]'
            >
              {buscando ? 'Importando...' : 'Importar Faixa'}
            </Button>
          ) : null}
        </div>
        <div className='overflow-x-auto rounded-md border border-gray-200'>
          <table className='w-full min-w-190 text-sm'>
            <thead className='border-b bg-[#F5F5F5] text-left text-gray-700'>
              <tr>
                <th className='w-12 p-3'>
                  <Checkbox
                    aria-label='Selecionar todos os resultados'
                    checked={algunsResultadosSelecionados ? 'indeterminate' : todosResultadosSelecionados}
                    disabled={selecionaveis.length === 0}
                    onCheckedChange={onAlternarResultados}
                  />
                </th>
                <th className='p-3'>ID</th>
                <th className='p-3'>Número Patrimonial</th>
                <th className='p-3'>Nome</th>
                <th className='p-3'>Descrição</th>
                <th className='p-3'>Localização</th>
                <th className='p-3'>Situação</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((bem) => {
                const bloqueado = bloqueados.has(bem.id)
                return (
                  <tr key={bem.id} className='border-b hover:bg-gray-50'>
                    <td className='p-3'>
                      <Checkbox
                        aria-label={`Selecionar bem ID ${bem.id}`}
                        checked={selecionados.has(bem.id)}
                        disabled={!permiteSelecionarResultados || !bem.apto || bloqueado}
                        onCheckedChange={() => onAlternarBem(bem)}
                      />
                    </td>
                    <td className='p-3'>{bem.id}</td>
                    <td className='p-3'>{bem.numero_patrimonial ?? 'Sem número patrimonial'}</td>
                    <td className='p-3'>{bem.nome}</td>
                    <td className='p-3'>{bem.descricao}</td>
                    <td className='p-3'>{bem.localizacao || '-'}</td>
                    <td className='p-3'>{bem.motivo ?? 'Apto para movimentação'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {proximaPagina ? (
          <Button
            type='button'
            variant='outline'
            onClick={() => onCarregarMais(proximaPagina)}
            disabled={buscando}
          >
            Carregar mais
          </Button>
        ) : null}
      </div>

      <div className='space-y-3'>
        <p className='text-sm font-semibold text-[#00703C]'>Selecionados ({selecionados.size})</p>
        <div className='overflow-x-auto rounded-md border border-gray-200'>
          <table className='w-full min-w-150 text-sm'>
            <thead className='border-b bg-[#F5F5F5] text-left text-gray-700'>
              <tr>
                <th className='p-3'>Número Patrimonial / Critério</th>
                <th className='p-3'>Quantidade</th>
                <th className='p-3'>Nome do Bem</th>
                <th className='p-3 text-center'>Ação</th>
              </tr>
            </thead>
            <tbody>
              {selecoes.map((selecao) => (
                <tr key={selecao.id} className='border-b'>
                  <td className='p-3'>{identificacaoSelecao(selecao)}</td>
                  <td className='p-3'>{selecao.bens.length}</td>
                  <td className='p-3'>{nomesSelecao(selecao)}</td>
                  <td className='p-3 text-center'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      aria-label={`Remover seleção ${identificacaoSelecao(selecao)}`}
                      onClick={() => onRemoverSelecao(selecao.id)}
                    >
                      <Trash2 className='size-5 text-[#00703C]' />
                    </Button>
                  </td>
                </tr>
              ))}
              {selecoes.length === 0 ? (
                <tr><td colSpan={4} className='p-6 text-center text-gray-500'>Nenhum bem selecionado.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
