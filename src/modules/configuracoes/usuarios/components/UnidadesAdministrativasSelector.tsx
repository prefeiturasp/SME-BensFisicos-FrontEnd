import { ChevronDown, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Label } from "@/components/ui/label"

import type { EscopoUa } from "../../../../auth/auth.service"

type Props = Readonly<{
  label: string
  unidadesListadas: EscopoUa[]
  unidadesSelecionadas: EscopoUa[]
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
  label,
  unidadesListadas,
  unidadesSelecionadas = [],
  isSelecionada,
  todasUnidades,
  disabled = false,
  filtroUa,
  requiredNode,
  errorMessage,
  onFiltroChange,
  onToggleTodasUnidades,
  onToggleUa,
}: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickFora = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickFora)
    return () => document.removeEventListener("mousedown", handleClickFora)
  }, [open])

  const abrir = () => {
    if (!disabled) setOpen(true)
  }

  return (
    <div className="flex flex-col gap-2" ref={containerRef}>
      <Label className="text-sm font-semibold text-gray-700">
        {label}
        {requiredNode ?? null}
      </Label>

      <div className="relative group">
        <div
          className={`flex items-center gap-2 min-h-11 w-full rounded-xs border px-2 py-1.5 text-sm ${
            disabled ? "border-gray-200 bg-gray-100 cursor-not-allowed" : "border-gray-300 bg-white cursor-text"
          }`}
        >
          <input
            value={filtroUa}
            onChange={(e) => onFiltroChange(e.target.value)}
            onFocus={abrir}
            placeholder="Pesquise por código ou UA"
            className={`flex-1 min-w-[8rem] border-0 outline-none bg-transparent text-gray-700 ${disabled ? "cursor-not-allowed" : ""}`}
            disabled={disabled}
          />

          {!todasUnidades && unidadesSelecionadas.length > 0 && (
            <span className="whitespace-nowrap rounded-full bg-green-50 text-green-900 border border-green-200 px-2 py-0.5 text-xs">
              {unidadesSelecionadas.length} selecionada{unidadesSelecionadas.length > 1 ? "s" : ""}
            </span>
          )}

          <label className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-medium ${disabled ? "text-gray-400 cursor-not-allowed" : "text-gray-600 cursor-pointer"}`}>
            <input
              type="checkbox"
              checked={todasUnidades}
              onChange={onToggleTodasUnidades}
              disabled={disabled}
              className={`h-4 w-4 ${disabled ? "cursor-not-allowed" : "cursor-pointer"} accent-[#2F7D57]`}
            />
            <span>Todas</span>
          </label>

          <button
            type="button"
            onClick={() => (open ? setOpen(false) : abrir())}
            disabled={disabled}
            aria-label="Abrir lista de unidades"
            className={disabled ? "cursor-not-allowed" : "cursor-pointer"}
          >
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Tooltip: nomes das UAs selecionadas ao passar o mouse no campo (CSS puro) */}
        {!open && (todasUnidades || unidadesSelecionadas.length > 0) && (
          <div className="hidden group-hover:block group-focus-within:block absolute z-30 left-0 top-full mt-1 max-w-full rounded-md bg-gray-800 text-white text-xs px-3 py-2 shadow-lg">
            {todasUnidades ? (
              <span>Todas as UAs</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {unidadesSelecionadas.map((ua) => (
                  <span key={ua.unidade_administrativa_id} className="rounded bg-gray-700 px-1.5 py-0.5">
                    {ua.nome}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {open && !disabled && (
          <div className="absolute z-20 mt-1 w-full rounded-xs border border-gray-300 bg-white shadow-lg max-h-48 overflow-y-auto">
            {unidadesListadas.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">Nenhuma unidade encontrada.</div>
            ) : (
              unidadesListadas.map((ua) => {
                const selecionada = todasUnidades || isSelecionada(ua.unidade_administrativa_id)
                return (
                  <button
                    key={ua.unidade_administrativa_id}
                    type="button"
                    onClick={() => onToggleUa(ua)}
                    className={`flex w-full items-center justify-between px-3 py-2 border-b border-gray-100 text-sm text-left ${
                      selecionada ? "bg-green-50 text-green-900" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{ua.codigo} - {ua.nome}</span>
                    {selecionada && <X size={16} className="text-gray-500" />}
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {disabled && (
        <span className="text-sm text-gray-500">
          Selecione uma Unidade Orçamentária para habilitar as Unidades Administrativas.
        </span>
      )}
      {errorMessage && <span className="text-red-600 text-sm">{errorMessage}</span>}
    </div>
  )
}