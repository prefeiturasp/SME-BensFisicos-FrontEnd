import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpDown, Eye, FileText, House } from 'lucide-react'
import { toast } from 'sonner'

import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { downloadBlobFile, getErrorMessage } from '@/lib/unidades-list-page'

import { authService, type EscopoUa } from '../../../../auth/auth.service'
import { usuarioService } from '../service/usuario.service'
import { usePagination } from '../hooks/usePagination'
import { useUsuariosList } from '../hooks/useUsuariosList'

const PAGE_SIZE = 10

const INPUT_CLASS =
  'h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white flex items-center'
const INPUT_SEARCH_CLASS =
  'h-9 w-full border border-gray-300 rounded-xs px-4 text-sm text-gray-700 bg-white font-normal'
const ACTION_BUTTON_CLASS =
  'h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors'

const ORDERING_MAP: Record<string, string> = {
  id: 'id',
  username: 'username',
  nome: 'nome',
  unidade_orcamentaria: 'unidade_orcamentaria__nome',
  grupo: 'grupo__nome',
  status: 'status',
}

function resolveNextOrdering(prevOrdering: string, backendField: string) {
  if (prevOrdering === backendField) return `-${backendField}`
  if (prevOrdering === `-${backendField}`) return ''
  return backendField
}

function resolveUnidadeOrcamentariaDisplay(
  usuario: {
    unidade_orcamentaria_codigo?: string | null
    unidade_orcamentaria_nome?: string | null
    unidade_orcamentaria?: number | null
  },
  uoLabelsById: Record<number, string>
) {
  if (usuario.unidade_orcamentaria_codigo && usuario.unidade_orcamentaria_nome) {
    return `${usuario.unidade_orcamentaria_codigo} - ${usuario.unidade_orcamentaria_nome}`
  }
  if (usuario.unidade_orcamentaria) {
    return uoLabelsById[usuario.unidade_orcamentaria] ?? `UO ${usuario.unidade_orcamentaria}`
  }
  return '—'
}

export default function UsuariosListPage() {
  const navigate = useNavigate()

  const [unidades, setUnidades] = useState<EscopoUa[]>([])
  const [uoLabelsById, setUoLabelsById] = useState<Record<number, string>>({})
  const [canManage, setCanManage] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)

  const {
    usuarios,
    page,
    count,
    loading,
    searchInput,
    unidadeFilter,
    uoFilter,
    grupoFilter,
    statusFilter,
    setPage,
    setSearchInput,
    setUnidadeFilter,
    setUoFilter,
    setGrupoFilter,
    setStatusFilter,
    setOrdering,
  } = useUsuariosList({ pageSize: PAGE_SIZE })

  const { pages, totalPages } = usePagination({
    page,
    totalItems: count,
    pageSize: PAGE_SIZE,
  })

  useEffect(() => {
    const carregarUnidadesDoEscopo = async () => {
      try {
        const { data: me } = await authService.getCurrentUser()
        setCanManage(Boolean(me.is_superuser || me.is_gestor_patrimonio))

        const grupos = me.opcoes_escopo?.grupos ?? []
        const uas: EscopoUa[] = grupos.flatMap((grupo) => grupo.uas)
        const uoLabels = grupos.reduce<Record<number, string>>((acc, grupo) => {
          if (grupo?.uo?.id && grupo?.uo?.label) acc[grupo.uo.id] = grupo.uo.label
          return acc
        }, {})

        setUnidades(uas)
        setUoLabelsById(uoLabels)
      } catch (error) {
        console.error('Erro ao carregar unidades do escopo', error)
      }
    }

    carregarUnidadesDoEscopo()
  }, [])

  const unidadesFiltradasPorUo = useMemo(() => {
    if (uoFilter === 'todas') return unidades
    const uoId = Number(uoFilter)
    return unidades.filter((ua) => ua.unidade_orcamentaria_id === uoId)
  }, [unidades, uoFilter])

  const handleSort = (field: string) => {
    const backendField = ORDERING_MAP[field] ?? field
    setPage(1)
    setOrdering((prev) => resolveNextOrdering(prev, backendField))
  }

  const handleNovoUsuario = () => navigate('/usuarios/novo')
  const handleDetalhar = (id: number) => navigate(`/usuarios/${id}`)

  const handleReport = async () => {
    if (reportLoading || !canManage) return

    try {
      setReportLoading(true)

      const { blob, fileName } = await usuarioService.exportar()
      downloadBlobFile(blob, fileName)
      toast.success('Relatório exportado com sucesso.')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Erro ao exportar relatório.'))
    } finally {
      setReportLoading(false)
    }
  }

  return (
    <div className='space-y-4 p-8'>
      <AppBreadcrumb
        items={[
          { label: 'Início', icon: House },
          { label: 'Usuários', isActive: true },
        ]}
      />

      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>Usuários</h1>

        <div className='flex items-center gap-3'>
          <Button type='button' onClick={() => navigate(-1)} className={ACTION_BUTTON_CLASS}>
            <ArrowLeft size={18} />
          </Button>

          {canManage && (
            <Button
              type='button'
              className={ACTION_BUTTON_CLASS}
              onClick={handleReport}
              disabled={reportLoading}
            >
              <FileText size={16} />
              {reportLoading ? 'Gerando...' : 'Relatório'}
            </Button>
          )}

          <Button onClick={handleNovoUsuario} className={ACTION_BUTTON_CLASS}>
            Adicionar Usuário
          </Button>
        </div>
      </div>

      <Card className='space-y-6 p-6'>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-5  md:items-end'>
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-semibold text-gray-700'>
              <span>Filtrar por Nome do Usuário</span>
              <input
                type='text'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={INPUT_SEARCH_CLASS}
                placeholder='Digite o nome do usuário'
              />
            </label>
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-sm font-semibold text-gray-700'>
              <span>Filtrar por Unidade Orçamentária</span>
              <Select
                value={uoFilter}
                onValueChange={(v) => {
                  setUoFilter(v)
                  setUnidadeFilter('todas')
                  setPage(1)
                }}
              >
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='todas'>Todas</SelectItem>
                  {Object.entries(uoLabelsById).map(([uoId, label]) => (
                    <SelectItem key={uoId} value={uoId}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-sm font-semibold text-gray-700'>
              <span>Filtrar por Unidade Administrativa</span>
              <Select
                value={unidadeFilter}
                onValueChange={(v) => {
                  setUnidadeFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='todas'>Todas</SelectItem>
                  {unidadesFiltradasPorUo.map((ua) => (
                    <SelectItem key={ua.unidade_administrativa_id} value={ua.codigo}>
                      {ua.codigo} - {ua.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-sm font-semibold text-gray-700'>
              <span>Filtrar por Grupo</span>
              <Select
                value={grupoFilter}
                onValueChange={(v) => {
                  setGrupoFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='todos'>Todos</SelectItem>
                  <SelectItem value='GESTOR_PATRIMONIO'>Gestor</SelectItem>
                  <SelectItem value='OPERADOR_INVENTARIO'>Operador</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-sm font-semibold text-gray-700'>
              <span>Filtrar por Status</span>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='todos'>Todos</SelectItem>
                  <SelectItem value='ativo'>Ativo</SelectItem>
                  <SelectItem value='inativo'>Inativo</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='border-b bg-[#F5F5F5]'>
              <tr className='text-left font-semibold text-gray-600'>
                {[
                  { label: 'ID', field: 'id' },
                  { label: 'Usuário', field: 'username' },
                  { label: 'Nome do Usuário', field: 'nome' },
                  { label: 'Unidade Orçamentária', field: 'unidade_orcamentaria' },
                  { label: 'Grupo de Permissionamento', field: 'grupo' },
                  { label: 'Status', field: 'status' },
                ].map((col) => (
                  <th
                    key={col.field}
                    className='cursor-pointer p-3'
                    onClick={() => handleSort(col.field)}
                  >
                    <div className='flex items-center gap-2'>
                      {col.label}
                      <ArrowUpDown size={14} />
                    </div>
                  </th>
                ))}
                <th className='p-3 text-center'>Ações</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className='py-10 text-center'>
                    Carregando...
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => (
                  <tr key={usuario.id} className='border-b hover:bg-gray-50'>
                    <td className='p-3'>{usuario.id}</td>
                    <td className='p-3 font-medium'>{usuario.username}</td>
                    <td className='p-3'>{usuario.nome}</td>
                    <td className='p-3'>{resolveUnidadeOrcamentariaDisplay(usuario, uoLabelsById)}</td>
                    <td className='p-3'>{usuario.grupo_nome}</td>
                    <td className='p-3'>{usuario.status_display}</td>
                    <td className='p-3 text-center'>
                      <Button size='icon' variant='ghost' onClick={() => handleDetalhar(usuario.id)}>
                        <Eye size={18} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className='mt-8 flex justify-center'>
          <div className='flex items-center gap-1'>
            <Button
              size='icon'
              variant='ghost'
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              ‹
            </Button>

            {pages.map((item) =>
              item.type === 'ellipsis' ? (
                <span key={item.id} className='px-2 text-gray-500'>
                  ...
                </span>
              ) : (
                <Button
                  key={item.value}
                  size='sm'
                  variant='outline'
                  onClick={() => setPage(item.value)}
                  className={page === item.value ? 'border-[#00703C] bg-[#00703C] text-white' : ''}
                >
                  {item.value}
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
