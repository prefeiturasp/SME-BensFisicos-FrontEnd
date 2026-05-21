import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, Network, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { bemService, type Bem } from '../services/bem.service'
import { useAuth } from '@/auth/useAuth'
import HistoricoModal from '../modals/HistoricoModal'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'

const FIELD_CLASS =
  'h-11 w-full border border-gray-300 rounded-xs px-4 text-sm text-gray-700 bg-gray-100'
const ACTION_BUTTON_CLASS = `
  h-10
  px-6
  bg-white
  border border-[#2F7D57]
  text-[#2F7D57]
  hover:bg-[#2F7D57]
  hover:text-white
  font-semibold
  rounded-md
  transition-colors
`
export default function BemDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [bem, setBem] = useState<Bem | null>(null)
  const [loading, setLoading] = useState(true)
  const [openHistorico, setOpenHistorico] = useState(false)

  useEffect(() => {
    fetchBem()
  }, [id])

  const fetchBem = async () => {
    try {
      const data = await bemService.retrieve(Number(id))
      setBem(data)
    } catch {
      toast.error('Erro ao carregar bem')
      navigate('/bens-patrimoniais')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 data-testid="loader" className="animate-spin mx-auto" />
      </div>
    )
  }

  if (!bem) return null

  const podeEditar =
    user?.is_gestor_patrimonio &&
    bem.status !== 'baixa_fisica'

  return (
    <div className="p-8 space-y-6">
      <AppBreadcrumb
        items={[
          { label: 'Bem Patrimonial', icon: Network },
          { label: 'Bem Patrimonial', icon: Network, to: '/bens-patrimoniais' },
          { label: 'Editar Cadastro do Bem Patrimonial', isActive: true },
        ]}
      />

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight text-gray-700">
          Visualizar Cadastro do Bem Patrimonial
        </h1>

        <div className="flex gap-3">
          {podeEditar && (
            <Button
              variant="outline"
              onClick={() => navigate(`/bens-patrimoniais/${bem.id}/editar`)}
              className={`${ACTION_BUTTON_CLASS} flex items-center gap-2 px-6`}
            >
              <Pencil size={16} />
              Editar
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setOpenHistorico(true)}
            className={`${ACTION_BUTTON_CLASS} px-6`}
          >
            Histórico
          </Button>

          <HistoricoModal
            bemId={bem.id}
            open={openHistorico}
            onClose={() => setOpenHistorico(false)}
          />

          <Button
            variant="outline"
            onClick={() => navigate('/bens-patrimoniais')}
            className={`${ACTION_BUTTON_CLASS} px-6`}
          >
            <ArrowLeft size={16} className="mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-0">
        {/* STATUS */}
        <div className="flex justify-end">
          <div className="text-sm font-semibold text-[#00703C]">
            Status: {bem.status_display}
          </div>
        </div>

        {/* PRIMEIRA LINHA */}
        <div className="grid grid-cols-[1fr_1.6fr_auto_auto] gap-8 items-start">

          {/* UNIDADE */}
          <div>
            <label htmlFor="unidade_administrativa" className="text-sm font-semibold text-gray-700">
              Unidade Administrativa
            </label>
            <input
              id="unidade_administrativa"
              value={`${bem.unidade_administrativa_codigo} - ${bem.unidade_administrativa_nome}`}
              disabled
              className={FIELD_CLASS}
            />
          </div>

          {/* NÚMERO */}
          <div>
            <label htmlFor="numero_patrimonial" className="text-sm font-semibold text-gray-700">
              Número Patrimonial
            </label>
            <input
              id="numero_patrimonial"
              value={bem.numero_patrimonial ?? ''}
              disabled
              className={FIELD_CLASS}
            />
            <p className="text-xs text-gray-500">
              Formato padrão: 000.000000000-0
            </p>
          </div>

          {/* CHECK FORMATO ANTIGO */}
          <div className="pt-9">
            <input
              id="numero_formato_antigo"
              type="checkbox"
              checked={bem.numero_formato_antigo}
              disabled
              className="mr-2"
            />
            <label htmlFor="numero_formato_antigo" className="text-sm text-gray-700 whitespace-nowrap">
              Formato anterior
            </label>
            <p className="text-xs text-gray-500">
              Se marcado, não valida formato do número (valor livre)
            </p>
          </div>

          {/* CHECK SEM NUMERO */}
          <div className="pt-9">
            <input
              id="sem_numeracao"
              type="checkbox"
              checked={bem.sem_numeracao}
              disabled
              className="mr-2"
            />
            <label htmlFor="sem_numeracao" className="text-sm text-gray-700 whitespace-nowrap">
              Sem número patrimonial
            </label>
            <p className="text-xs text-gray-500">
              Se marcado, o sistema atribui automaticamente
            </p>
          </div>

        </div>

        {/* RESTANTE DOS CAMPOS */}
        <div className="grid grid-cols-3 gap-8">

          {/* NOME */}
          <div className="col-span-3">
            <label htmlFor="nome" className="text-sm font-semibold text-gray-700">
              Nome do Bem
            </label>
            <input
              id="nome"
              value={bem.nome}
              disabled
              className={FIELD_CLASS}
            />
          </div>

          {/* DESCRIÇÃO */}
          <div className="col-span-3">
            <label htmlFor="descricao" className="text-sm font-semibold text-gray-700">
              Descrição do Bem
            </label>
            <textarea
              id="descricao"
              value={bem.descricao ?? ''}
              disabled
              className="w-full border border-gray-300 rounded-xs px-4 py-3 text-sm min-h-[140px] bg-gray-100"
            />
          </div>

          {/* VALOR */}
          <div>
            <label htmlFor="valor_unitario" className="text-sm font-semibold text-gray-700">
              Valor unitário
            </label>
            <input
              id="valor_unitario"
              value={bem.valor_unitario ?? ''}
              disabled
              className={FIELD_CLASS}
            />
          </div>

          {/* MARCA */}
          <div>
            <label htmlFor="marca" className="text-sm font-semibold text-gray-700">
              Marca
            </label>
            <input
              id="marca"
              value={bem.marca ?? ''}
              disabled
              className={FIELD_CLASS}
            />
          </div>

          {/* MODELO */}
          <div>
            <label htmlFor="modelo" className="text-sm font-semibold text-gray-700">
              Modelo
            </label>
            <input
              id="modelo"
              value={bem.modelo ?? ''}
              disabled
              className={FIELD_CLASS}
            />
          </div>

          {/* LOCALIZAÇÃO */}
          <div>
            <label htmlFor="localizacao" className="text-sm font-semibold text-gray-700">
              Localização
            </label>
            <input
              id="localizacao"
              value={bem.localizacao ?? ''}
              disabled
              className={FIELD_CLASS}
            />
          </div>

          {/* PROCESSO INCORPORAÇÃO */}
          <div>
            <label htmlFor="numero_processo" className="text-sm font-semibold text-gray-700">
              Número do processo de incorporação
            </label>
            <input
              id="numero_processo"
              value={bem.numero_processo ?? ''}
              disabled
              className={FIELD_CLASS}
            />
          </div>

          {/* PROCESSO BAIXA */}
          <div>
            <label htmlFor="numero_processo_baixa" className="text-sm font-semibold text-gray-700">
              Número do Processo de Baixa
            </label>
            <input
              id="numero_processo_baixa"
              value={bem.numero_processo_baixa ?? ''}
              disabled
              className={FIELD_CLASS}
            />
          </div>

          {/* OBSERVAÇÃO */}
          <div className="col-span-3">
            <label htmlFor="observacao" className="text-sm font-semibold text-gray-700">
              Observação
            </label>
            <textarea
              id="observacao"
              value={bem.observacao ?? ''}
              disabled
              className="w-full border border-gray-300 rounded-xs px-4 py-3 text-sm min-h-[140px] bg-gray-100"
            />
          </div>

        </div>

        {/* METADADOS */}
        <div className="border-t pt-6 text-xs text-gray-500">
          Criado por: {bem.criado_por_nome} <br />
          Criado em: {bem.criado_em}
        </div>
      </Card>
    </div>
  )
}