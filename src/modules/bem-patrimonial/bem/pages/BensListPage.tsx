import { useMemo } from 'react'
import { Eye, Network, ArrowLeft, FileText, ArrowUpDown, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { EscopoFilterDropdown } from '@/components/EscopoFilterDropdown'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { BuscaEspecialFilter } from '../components/BuscaEspecialFilter'
import { useBensList } from '../hooks/useBensList'
import { usePagination } from '../hooks/usePagination'

const PAGE_SIZE = 10

const INPUT_CLASS =
  'h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white flex items-center'

const INPUT_SEARCH_CLASS =
  'h-9 w-full border border-gray-300 rounded-xs px-4 text-sm text-gray-700 bg-white'

const ACTION_BUTTON_CLASS = `
  h-10 px-6 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white font-semibold rounded-md transition-colors
`
const ORDERING_MAP: Record<string, string> = {
  numero_patrimonial: 'numero_patrimonial',
  nome: 'nome',
  unidade_administrativa: 'unidade_administrativa__nome',
  status: 'status',
}

export default function BensListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const persistKey = `bens-list:${user?.id ?? 'anon'}`

  const grupos = useMemo(
    () => user?.opcoes_escopo?.grupos ?? [],
    [user?.opcoes_escopo?.grupos],
  )

  const {
    bens,
    selectedIds,
    page,
    count,
    loading,
    searchInput,
    statusFilter,
    unidadesAdministrativas,
    bensBaixados,
    buscaGeralUos,
    ordering,
    setPage,
    setSearchInput,
    setStatusFilter,
    setUnidadesAdministrativas,
    setBensBaixados,
    setBuscaGeralUos,
    setOrdering,
    toggleSelect,
    atualizarStatusSelecionados,
  } = useBensList({
    pageSize: PAGE_SIZE,
    persistKey,
    grupos,
  })

  const { pages, totalPages } = usePagination({
    page,
    totalItems: count,
    pageSize: PAGE_SIZE,
  })

  const isGestor = user?.is_gestor_patrimonio ?? false
  const possuiSelecionados = isGestor && selectedIds.length > 0

  const handleSort = (field: string) => {
    const backendField = ORDERING_MAP[field] ?? field

    setPage(1)

    setOrdering(prev => {
      if (prev === backendField) return `-${backendField}`
      if (prev === `-${backendField}`) return ''
      return backendField
    })
  }

  const handleNovoCadastro = () => {
    navigate('/bens-patrimoniais/novo')
  }

  const handleDetalhar = (id: number) => {
    navigate(`/bens-patrimoniais/${id}`)
  }

  const handleImportar = () => {
    navigate('/bens-patrimoniais/importar')
  }

  return (
    <div className='p-8 space-y-4'>
      <AppBreadcrumb
        items={[
          { label: 'Bem Patrimonial', icon: Network },
          { label: 'Bens Patrimoniais', isActive: true },
        ]}
      />

      {/* HEADER */}
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>
          Bens Patrimoniais
        </h1>

        <div className='flex items-center gap-3'>
          <Button
            type='button'
            onClick={() => navigate(-1)}
            className={ACTION_BUTTON_CLASS}
          >
            <ArrowLeft size={18} />
          </Button>

          {possuiSelecionados && (
            <>
              <Button
                onClick={() =>
                  atualizarStatusSelecionados(
                    'aprovar',
                    'Bens aprovados com sucesso',
                    'Erro ao aprovar bens'
                  )
                }
                className='h-10 px-4 bg-[#00703C] hover:bg-[#005a30] text-white font-semibold rounded-md'
              >
                Aprovar ({selectedIds.length})
              </Button>

              <Button
                onClick={() =>
                  atualizarStatusSelecionados(
                    'reprovar',
                    'Bens reprovados com sucesso',
                    'Erro ao reprovar bens'
                  )
                }
                className='h-10 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md'
              >
                Reprovar ({selectedIds.length})
              </Button>
            </>
          )}

          <Button type='button' className={ACTION_BUTTON_CLASS}>
            <FileText size={16} />
            Relatório
          </Button>

          <Button
            type='button'
            onClick={() => handleImportar()}
            className={ACTION_BUTTON_CLASS}
          >
            Importar Bens
          </Button>

          <Button onClick={handleNovoCadastro} className={ACTION_BUTTON_CLASS}>
            Novo Cadastro
          </Button>
        </div>
      </div>

      {/* CARD */}
      <Card className='p-6 space-y-6'>
        {/* FILTROS */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <div className='flex flex-col gap-2'>
            <label
              htmlFor='search-bem'
              className='text-sm font-semibold text-gray-700'>
              Filtrar por Número ou Nome do Bem
            </label>
            <input
              type='text'
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className={INPUT_SEARCH_CLASS}
              placeholder='Digite Número ou Nome'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label
              htmlFor="filtro-unidade"
              className="text-sm font-semibold text-gray-700"
            >
              Filtrar por Unidade
            </label>

            <EscopoFilterDropdown
              id="filtro-unidade"
              grupos={grupos}
              value={unidadesAdministrativas}
              onChange={(uaIds: string[]) => {
                setUnidadesAdministrativas(uaIds)
                setPage(1)
              }}
            />
          </div>

          <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-1.5'>
              <label
                htmlFor="filtro-status"
                className="text-sm font-semibold text-gray-700"
              >
                Filtrar por Status
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    className='text-gray-400 hover:text-gray-600'
                    aria-label='Informações sobre a visualização de bens transferidos'
                  >
                    <Info size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  A listagem tem visualização padrão de todos os bens, menos os transferidos. Caso queira visualizá-los, selecione a opção Transferidos no filtro de Status abaixo.
                </TooltipContent>
              </Tooltip>
            </div>

            <Select
              id="filtro-status"
              value={statusFilter}
              onValueChange={(v: string) => {
                setStatusFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger className={INPUT_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='todos'>Todos</SelectItem>
                <SelectItem value='aguardando_aprovacao'>
                  Aguardando aprovação
                </SelectItem>
                <SelectItem value='aprovado'>Aprovado</SelectItem>
                <SelectItem value='nao_aprovado'>Não aprovado</SelectItem>
                <SelectItem value='baixa_fisica'>Baixa Física</SelectItem>
                <SelectItem value='transferido'>Transferidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col gap-2'>
            <label
              htmlFor='busca-especial'
              className='text-sm font-semibold text-gray-700'
            >
              Busca Especial
            </label>

            <BuscaEspecialFilter
              id='busca-especial'
              buscaGeralUos={buscaGeralUos}
              bensBaixados={bensBaixados}
              triggerClassName={INPUT_SEARCH_CLASS}
              onChangeBuscaGeralUos={checked => {
                setBuscaGeralUos(checked)
                if (checked) {
                  setUnidadesAdministrativas([])
                }
                setPage(1)
              }}
              onChangeBensBaixados={checked => {
                setBensBaixados(checked)
                setPage(1)
              }}
            />
          </div>
        </div>

        {/* TABELA */}
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-[#F5F5F5] border-b'>
              <tr className='text-left text-gray-600 font-semibold'>
                <th className='p-3 w-10' />
                {[
                  { label: 'Número Patrimonial', field: 'numero_patrimonial' },
                  { label: 'Nome do Bem', field: 'nome' },
                  { label: 'Unidade Administrativa', field: 'unidade_administrativa' },
                  { label: 'Status', field: 'status' },
                ].map(col => (
                  <th
                    key={col.field}
                    className={`p-3 cursor-pointer select-none${
                      col.field === 'status' ? ' whitespace-nowrap' : ''
                    }${
                      col.field === 'unidade_administrativa'
                        ? ' max-w-[180px]'
                        : ''
                    }`}
                    onClick={() => handleSort(col.field)}
                  >
                    <div className='flex items-center gap-2'>
                      {col.label}
                      <ArrowUpDown
                        size={14}
                        className={
                          ordering.includes(col.field)
                            ? 'text-[#00703C]'
                            : 'text-gray-400'
                        }
                      />
                    </div>
                  </th>
                ))}
                <th className='p-3 text-center'>Ações</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <span aria-live="polite">Carregando...</span>
                  </td>
                </tr>
              ) : (
                bens.map(bem => (
                  <tr key={bem.id} className='border-b hover:bg-gray-50'>
                    <td className='p-3'>
                      <input
                        type='checkbox'
                        disabled={bem.status !== 'aguardando_aprovacao'}
                        checked={selectedIds.includes(bem.id)}
                        onChange={() => toggleSelect(bem)}
                      />
                    </td>

                    <td className='p-3 font-medium'>
                      {bem.numero_patrimonial ?? '-'}
                    </td>
                    <td className='p-3'>{bem.nome}</td>
                    <td
                      className='p-3 max-w-[180px] truncate'
                      title={`${bem.unidade_administrativa_codigo} - ${bem.unidade_administrativa_nome}`}
                    >
                      {bem.unidade_administrativa_codigo} -{' '}
                      {bem.unidade_administrativa_nome}
                    </td>
                    <td className='p-3 whitespace-nowrap'>{bem.status_display}</td>
                    <td className='p-3 text-center'>
                      <Button
                        aria-label="Visualizar bem"
                        size='icon'
                        variant='ghost'
                        onClick={() => handleDetalhar(bem.id)}
                      >
                        <Eye className='size-[22px] text-[#00703C]' />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO */}
        <div className='flex justify-center mt-8'>
          <div className='flex items-center gap-1'>
            <Button
              size='icon'
              variant='ghost'
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              ‹
            </Button>

            {pages.map((item, index) =>
              item === '...' ? (
                <span
                  key={`${item}-${index}-${pages.length}`}
                  className="px-2 text-gray-500 text-sm"
                >
                  ...
                </span>
              ) : (
                <Button
                  key={item}
                  size='sm'
                  variant='outline'
                  onClick={() => setPage(Number(item))}
                  className={
                    page === item
                      ? 'bg-[#00703C] text-white border-[#00703C]'
                      : ''
                  }
                >
                  {item}
                </Button>
              )
            )}

            <Button
              size='icon'
              variant='ghost'
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              ›
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}