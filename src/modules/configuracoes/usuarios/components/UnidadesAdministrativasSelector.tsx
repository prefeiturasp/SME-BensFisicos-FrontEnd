import { ListFilter, X } from "lucide-react"
import type { EscopoUa } from "../../../../auth/auth.service"

type Props = Readonly<{
  unidadesListadas: EscopoUa[]
  unidadesSelecionadasCount: number
  isSelecionada: (uaId: number) => boolean
  somenteSelecionadas: boolean
  filtroUa: string
  inputClassName: string
  requiredNode?: React.ReactNode
  errorMessage?: string
  onFiltroChange: (value: string) => void
  onToggleSomenteSelecionadas: () => void
  onToggleUa: (ua: EscopoUa) => void
}>

export function UnidadesAdministrativasSelector({
  unidadesListadas,
  unidadesSelecionadasCount,
  isSelecionada,
  somenteSelecionadas,
  filtroUa,
  inputClassName,
  requiredNode,
  errorMessage,
  onFiltroChange,
  onToggleSomenteSelecionadas,
  onToggleUa,
}: Props) {
  return (
    <div className="md:col-span-2 flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700">
        Unidades Administrativas
        {requiredNode ?? null}
      </label>
      <div className="border border-gray-300 rounded-xs max-w-[940px]">
        <div className="p-2 border-b border-gray-200 flex items-center gap-2">
          <input
            value={filtroUa}
            onChange={(e) => onFiltroChange(e.target.value)}
            placeholder="Pesquisar unidade por codigo ou nome"
            className={inputClassName}
          />
          <button
            type="button"
            aria-pressed={somenteSelecionadas}
            disabled={unidadesSelecionadasCount === 0}
            onClick={onToggleSomenteSelecionadas}
            className={`h-11 rounded-xs border px-3 text-sm font-medium flex items-center gap-2 whitespace-nowrap ${
              unidadesSelecionadasCount === 0
                ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                : somenteSelecionadas
                  ? "border-[#2F7D57] bg-[#2F7D57] text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <ListFilter size={14} />
            <span>
              {unidadesSelecionadasCount === 0
                ? "Nenhuma selecionada"
                : `${unidadesSelecionadasCount} selecionadas`}
            </span>
          </button>
        </div>
        <div className="max-h-32 overflow-y-auto">
          {unidadesListadas.map((ua) => {
            const selecionada = isSelecionada(ua.unidade_administrativa_id)
            return (
              <div
                key={ua.unidade_administrativa_id}
                className={`flex items-center justify-between px-3 py-2 border-b border-gray-100 text-sm ${
                  selecionada
                    ? "bg-green-50 text-green-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() => onToggleUa(ua)}
                >
                  {ua.codigo} - {ua.nome}
                </button>
                {selecionada && (
                  <button
                    type="button"
                    onClick={() => onToggleUa(ua)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {errorMessage && <span className="text-red-600 text-sm">{errorMessage}</span>}
    </div>
  )
}

