import { X } from "lucide-react"
import type { EscopoUa } from "../../../../auth/auth.service"

type Props = Readonly<{
  unidadesListadas: EscopoUa[]
  isSelecionada: (uaId: number) => boolean
  todasUnidades: boolean
  disabled?: boolean
  filtroUa: string
  inputClassName: string
  requiredNode?: React.ReactNode
  errorMessage?: string
  onFiltroChange: (value: string) => void
  onToggleTodasUnidades: () => void
  onToggleUa: (ua: EscopoUa) => void
}>

export function UnidadesAdministrativasSelector({
  unidadesListadas,
  isSelecionada,
  todasUnidades,
  disabled = false,
  filtroUa,
  inputClassName,
  requiredNode,
  errorMessage,
  onFiltroChange,
  onToggleTodasUnidades,
  onToggleUa,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700">
        Unidades Administrativas
        {requiredNode ?? null}
      </label>
      <div className={`border rounded-xs ${disabled ? "border-gray-200 bg-gray-100" : "border-gray-300 bg-white"}`}>
        <div className="p-2 border-b border-gray-200 flex items-center gap-2">
          <input
            value={filtroUa}
            onChange={(e) => onFiltroChange(e.target.value)}
            placeholder="Pesquisar unidade por codigo ou nome"
            className={`${inputClassName} ${disabled ? "cursor-not-allowed bg-gray-100 text-gray-500 border-gray-200" : ""}`}
            disabled={disabled}
          />
          <label
            className={`h-11 rounded-xs border px-3 text-sm font-medium flex items-center gap-2 whitespace-nowrap ${
              disabled
                ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                : "border-gray-300 bg-white text-gray-700 cursor-pointer"
            }`}
          >
            <input
              type="checkbox"
              checked={todasUnidades}
              onChange={onToggleTodasUnidades}
              disabled={disabled}
              className={`h-4 w-4 ${disabled ? "cursor-not-allowed" : "cursor-pointer"} accent-[#2F7D57]`}
            />
            <span>Todas Unidades Administrativas</span>
          </label>
        </div>
        {!disabled && (
          <div className="max-h-32 overflow-y-auto">
          {unidadesListadas.map((ua) => {
            const selecionada = todasUnidades || isSelecionada(ua.unidade_administrativa_id)
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
        )}
        {disabled && (
          <div className="px-3 py-3 text-sm text-gray-500 border-t border-gray-200 cursor-not-allowed select-none">
            Selecione uma Unidade Orçamentária para habilitar as Unidades Administrativas.
          </div>
        )}
      </div>
      {errorMessage && <span className="text-red-600 text-sm">{errorMessage}</span>}
    </div>
  )
}

