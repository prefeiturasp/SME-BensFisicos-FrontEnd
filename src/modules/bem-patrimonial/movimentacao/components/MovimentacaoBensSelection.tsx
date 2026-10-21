import { useState } from 'react'
import { CircleAlert, Pencil, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { MovimentacaoBemBusca } from '../types/movimentacao.types'
import { AJUDAS_MOVIMENTACAO, MovimentacaoHelp } from './MovimentacaoHelp'

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
  modoTodos: boolean
  onAlternarBem: (bem: MovimentacaoBemBusca) => void
  onAlternarResultados: () => void
  onImportarFaixa: () => void
  onCarregarMais: (pagina: number) => void
  onRemoverSelecao: (id: string) => void
  onEditarFaixa?: (id: string) => void
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
  return bem.numero_patrimonial?.trim() || 'Sem número patrimonial'
}

function nomesSelecao(selecao: SelecaoMovimentacao) {
  const nomes = selecao.bens.slice(0, 2).map((bem) => bem.nome).join(', ')
  return selecao.bens.length > 2 ? `${nomes} e mais ${selecao.bens.length - 2}` : nomes
}

export function ResumoBensMovimentacao({ selecoes, onRemoverSelecao, onEditarFaixa }: Readonly<{
  selecoes: SelecaoMovimentacao[]
  onRemoverSelecao?: (id: string) => void
  onEditarFaixa?: (id: string) => void
}>) {
  const [remocao, setRemocao] = useState<SelecaoMovimentacao | null>(null)
  if (selecoes.length === 0) return <></>
  const quantidade = idsSelecionados(selecoes).size
  const automatica = selecoes.length === 1 && selecoes[0].tipo === 'todos'
  const linhas: SelecaoMovimentacao[] = automatica
    ? selecoes[0].bens.map((bem) => ({ id: `bem-${bem.id}`, tipo: 'individual', bens: [bem] }))
    : selecoes
  const removerSelecao = automatica ? undefined : onRemoverSelecao
  return (
    <section className='space-y-3' aria-label={automatica ? 'Bens selecionados automaticamente' : 'Bens selecionados'}>
      <p className='text-sm font-semibold text-[#00703C]'>Selecionados ({quantidade})</p>
      {automatica ? (
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <p>Todos os bens aptos da UA de origem</p>
          <MovimentacaoHelp label='Sobre a seleção automática'
            text='Todos os bens aptos da UA de origem serão incluídos na movimentação. Para marcar ou desmarcar bens específicos, volte para Seleção manual.' />
        </div>
      ) : null}
      <div className='overflow-x-auto rounded-md border border-gray-200'>
        <table className='w-full min-w-150 text-sm'>
          <thead className='border-b bg-[#F5F5F5] text-left text-gray-700'>
            <tr>
              <th className='p-3'>Número Patrimonial</th>
              {automatica ? null : <th className='p-3'>Quantidade</th>}
              <th className='p-3'>Nome do Bem</th>
              {removerSelecao ? <th className='p-3 text-center'>Ação</th> : null}
            </tr>
          </thead>
          <tbody>
            {linhas.map((selecao) => (
              <tr key={selecao.id} className='border-b'>
                <td className='p-3'>
                  {identificacaoSelecao(selecao)}
                  {selecao.tipo === 'faixa' ? <span className='mt-1 block text-xs text-gray-500'>Faixa completa · seleção em conjunto</span> : null}
                </td>
                {automatica ? null : <td className='p-3'>{selecao.bens.length}</td>}
                <td className='p-3'>
                  {onEditarFaixa ? nomesSelecao(selecao) : selecao.bens.map((bem) => bem.nome).join(', ')}
                </td>
                {removerSelecao ? (
                  <td className='p-3 text-center'>
                    {selecao.tipo === 'faixa' && onEditarFaixa ? (
                      <Button type='button' variant='ghost' size='icon' title='Ver/editar faixa'
                        aria-label={`Ver/editar faixa ${identificacaoSelecao(selecao)}`}
                        onClick={() => onEditarFaixa(selecao.id)}>
                        <Pencil className='size-5 text-[#00703C]' />
                      </Button>
                    ) : null}
                    <Button type='button' variant='ghost' size='icon'
                      aria-label={`Remover seleção ${identificacaoSelecao(selecao)}`}
                      onClick={() => setRemocao(selecao)}>
                      <Trash2 className='size-5 text-[#00703C]' />
                    </Button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmDialog open={Boolean(remocao)} title='Remover seleção?' variant='destructive'
        confirmLabel='Remover da seleção' cancelLabel='Voltar'
        message={remocao ? `Deseja remover ${identificacaoSelecao(remocao)} da movimentação? Os cadastros dos bens não serão apagados.` : ''}
        onClose={() => setRemocao(null)} onConfirm={() => {
          if (remocao) removerSelecao?.(remocao.id)
          setRemocao(null)
        }} />
    </section>
  )
}

function ResultadoBem({ bem, bloqueado, selecionado, permiteSelecionar, onAlternar }: Readonly<{
  bem: MovimentacaoBemBusca
  bloqueado: boolean
  selecionado: boolean
  permiteSelecionar: boolean
  onAlternar: (bem: MovimentacaoBemBusca) => void
}>) {
  const emFaixa = bloqueado && bem.apto
  const desabilitado = !bem.apto || bloqueado
  const semNumero = !bem.numero_patrimonial?.trim()
  const situacao = emFaixa ? 'Já incluído em uma faixa selecionada' : bem.motivo ?? 'Apto para movimentação'
  const motivo = emFaixa
    ? 'Este bem pertence a uma faixa selecionada e não pode ser desmarcado individualmente. Para retirá-lo, remova a faixa da lista de selecionados.'
    : bem.motivo ?? 'Este bem não está apto para movimentação.'
  return (
    <tr className={`border-b ${desabilitado ? 'bg-gray-100 text-gray-500' : 'text-gray-900 hover:bg-gray-50'}`} aria-disabled={desabilitado}>
      {permiteSelecionar ? <td className='p-3'>
        <Checkbox aria-label={`Selecionar bem ID ${bem.id}`} checked={selecionado}
          disabled={!permiteSelecionar || desabilitado}
          onCheckedChange={() => onAlternar(bem)} />
      </td> : null}
      <td className='p-3'>{bem.id}</td>
      <td className='p-3'>
        <span className='inline-flex items-center gap-2'>
          {bem.numero_patrimonial?.trim() || 'Sem número patrimonial'}
          {semNumero ? <MovimentacaoHelp label={`Sobre a numeração do bem ${bem.nome}`}
            text='Este bem está cadastrado sem número patrimonial. Sua seleção segue as mesmas regras de movimentação dos demais bens; a ausência do número, por si só, não impede a movimentação.' /> : null}
        </span>
      </td>
      <td className='p-3'>{bem.nome}</td>
      <td className='p-3'>{bem.descricao}</td>
      <td className='p-3'>{bem.localizacao || '-'}</td>
      <td className='p-3'>
          {desabilitado ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type='button' aria-label={`Motivo do bloqueio do bem ID ${bem.id}`}
                  className='flex w-64 max-w-full items-center gap-2 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2'>
                  <span className='min-w-0 flex-1 truncate'>{situacao}</span>
                  <CircleAlert className='size-4 shrink-0 text-amber-700' />
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={8} className='max-w-xs'>{motivo}</TooltipContent>
            </Tooltip>
          ) : situacao}
      </td>
    </tr>
  )
}

function ImportarFaixa({ buscando, onImportar }: Readonly<{ buscando: boolean; onImportar: () => void }>) {
  return (
    <div className='flex items-center gap-2'>
      <Button type='button' onClick={onImportar} disabled={buscando}
        className='h-10 bg-[#2F7D57] px-5 font-semibold text-white hover:bg-[#256947]'>
        {buscando ? 'Importando...' : 'Importar Faixa'}
      </Button>
      <MovimentacaoHelp label='Ajuda sobre importar faixa' text={AJUDAS_MOVIMENTACAO.importar} />
    </div>
  )
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
  modoTodos,
  onAlternarBem,
  onAlternarResultados,
  onImportarFaixa,
  onCarregarMais,
  onRemoverSelecao,
  onEditarFaixa,
}: Props) {
  const selecionados = idsSelecionados(selecoes)
  const exibirResultados = resultados.length > 0 && !modoTodos
  const bloqueados = idsBloqueados(selecoes)
  const selecionaveis = resultados.filter(
    (bem) => permiteSelecionarResultados && bem.apto && !bloqueados.has(bem.id),
  )
  const todosResultadosSelecionados =
    selecionaveis.length > 0 && selecionaveis.every((bem) => selecionados.has(bem.id))
  const algunsResultadosSelecionados =
    !todosResultadosSelecionados && selecionaveis.some((bem) => selecionados.has(bem.id))

  return (
    <div className='space-y-5'>
      {buscaRealizada && totalResultados === 0 && !modoTodos ? (
        <p className='text-sm text-gray-500'>Nenhum bem encontrado para a busca informada.</p>
      ) : null}

      {exibirResultados ? <div className='space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <p className='text-sm font-semibold text-gray-700'>Resultados da Busca ({totalResultados})</p>
            <MovimentacaoHelp label='Quem pode ser adicionado?' text={AJUDAS_MOVIMENTACAO.regras} />
          </div>
          {permiteImportarFaixa ? <ImportarFaixa buscando={buscando} onImportar={onImportarFaixa} /> : null}
        </div>
        <div className='overflow-x-auto rounded-md border border-gray-200'>
          <table className='w-full min-w-190 text-sm'>
            <thead className='border-b bg-[#F5F5F5] text-left text-gray-700'>
              <tr>
                {permiteSelecionarResultados ? <th className='w-12 p-3'>
                    <Checkbox
                      aria-label='Selecionar todos os resultados'
                      checked={algunsResultadosSelecionados ? 'indeterminate' : todosResultadosSelecionados}
                      disabled={selecionaveis.length === 0}
                      onCheckedChange={onAlternarResultados}
                    />
                  </th> : null}
                <th className='p-3'>ID</th>
                <th className='p-3'>Número Patrimonial</th>
                <th className='p-3'>Nome</th>
                <th className='p-3'>Descrição</th>
                <th className='p-3'>Localização</th>
                <th className='p-3'>Situação</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((bem) => (
                <ResultadoBem key={bem.id} bem={bem} bloqueado={bloqueados.has(bem.id)}
                  selecionado={selecionados.has(bem.id)} permiteSelecionar={permiteSelecionarResultados}
                  onAlternar={onAlternarBem} />
              ))}
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
      </div> : null}
      <ResumoBensMovimentacao selecoes={selecoes} onRemoverSelecao={onRemoverSelecao} onEditarFaixa={onEditarFaixa} />
    </div>
  )
}
