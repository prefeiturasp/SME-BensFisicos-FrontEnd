import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Plus, Trash2, X, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

import { AppBreadcrumb } from "@/components/AppBreadcrumb"
import { bemService, type Bem } from "../../bem/services/bem.service"
import { baixaFisicaService } from "../service/baixas.service"
import { UnidadeAdministrativaSelect } from "../components/UnidadeAdministrativaSelect"
import type { ItemRow } from '../types/baixas-fisicas.types'

// ============================================================================
// STYLES
// ============================================================================

const INPUT_CLASS =
    "h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white"

const ACTION_BUTTON_CLASS = `
  h-10 px-6 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white font-semibold rounded-md transition-colors
`

const ICON_BTN = `
  h-10 w-10 flex items-center justify-center rounded border
  border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white
  transition-colors shrink-0
`

// ============================================================================
// BEM SELECTOR ROW
// ============================================================================

interface BemSelectorRowProps {
    readonly row: ItemRow
    readonly allSelectedIds: number[]
    readonly unidadeId: number | null
    readonly onSelect: (rowId: number, bem: Bem) => void
    readonly onClear: (rowId: number) => void
    readonly onRemove: (rowId: number) => void
    readonly onAdd: () => void
    readonly isLast: boolean
}

function BemSelectorRow({ row, allSelectedIds, unidadeId, onSelect, onClear, onRemove, onAdd, isLast }: BemSelectorRowProps) {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const [results, setResults] = useState<Bem[]>([])
    const [loading, setLoading] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const search = useCallback(async (query: string) => {
        if (!unidadeId) return
        setLoading(true)
        try {
            const res = await bemService.list({
                search: query,
                status: "aprovado",
                unidade_administrativa: unidadeId,
            })
            setResults(res.results)
        } finally {
            setLoading(false)
        }
    }, [unidadeId])

    const handleFocus = () => {
        if (row.bem || !unidadeId) return
        setOpen(true)
        if (results.length === 0) search("")
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setInputValue(val)
        setOpen(true)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => search(val), 300)
    }

    const handleSelect = (bem: Bem) => {
        onSelect(row.rowId, bem)
        setInputValue("")
        setOpen(false)
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onClear(row.rowId)
        setInputValue("")
        setResults([])
    }

    const renderDropdownContent = () => {
        if (loading) {
            return <li className="px-3 py-2 text-sm text-gray-400">Buscando...</li>
        }
        if (results.length === 0) {
            return <li className="px-3 py-2 text-sm text-gray-400">Nenhum bem encontrado.</li>
        }
        return results.map((bem) => {
            const alreadyAdded = allSelectedIds.includes(bem.id)
            return (
                <li key={bem.id} className="border-b border-gray-100 last:border-0">
                    <button
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => handleSelect(bem)}
                        className={`w-full text-left px-3 py-2 text-sm ${
                            alreadyAdded
                                ? "text-gray-300 cursor-not-allowed bg-gray-50"
                                : "hover:bg-[#2F7D57] hover:text-white cursor-pointer"
                        }`}
                    >
                        <span className="font-mono mr-2">{bem.numero_patrimonial}</span>
                        {bem.nome}
                    </button>
                </li>
            )
        })
    }

    const isDisabled = !unidadeId

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 relative" ref={ref}>
                {row.bem ? (
                    <div className="h-11 w-full rounded-xs border border-gray-300 px-3 bg-white flex items-center justify-between">
                        <span className="text-sm text-gray-700 truncate">
                            <span className="font-mono mr-2 text-gray-500">{row.bem.numero_patrimonial}</span>
                            {row.bem.nome}
                        </span>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="text-gray-400 hover:text-gray-600 p-1"
                                aria-label="Limpar bem selecionado"
                            >
                                <X size={14} />
                            </button>
                            <ChevronDown size={14} className="text-gray-400" />
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        <input
                            id={`bem-input-${row.rowId}`}
                            value={inputValue}
                            onChange={handleInputChange}
                            onFocus={handleFocus}
                            placeholder={isDisabled ? "Selecione uma unidade administrativa primeiro" : "Selecione um bem"}
                            disabled={isDisabled}
                            className={`${INPUT_CLASS} pr-8 ${isDisabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
                            aria-label="Buscar bem patrimonial"
                        />
                        <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />

                        {open && !isDisabled && (
                            <ul className="absolute top-full left-0 right-0 mt-0 bg-white border border-gray-300 rounded shadow-lg z-20 max-h-56 overflow-auto">
                                {renderDropdownContent()}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {isLast ? (
                <button type="button" onClick={onAdd} className={ICON_BTN} aria-label="Adicionar item">
                    <Plus size={18} />
                </button>
            ) : (
                <div className="w-10 shrink-0" />
            )}

            <button
                type="button"
                onClick={() => onRemove(row.rowId)}
                className={ICON_BTN}
                aria-label="Remover item"
            >
                <Trash2 size={16} />
            </button>
        </div>
    )
}

// ============================================================================
// PAGE
// ============================================================================

let nextRowId = 1

export default function AdicionarBaixaPage() {
    const navigate = useNavigate()

    const [unidade, setUnidade] = useState("")
    // REMOVIDO: numeroProcesso e dataBaixa não fazem parte do novo fluxo
    const [rows, setRows] = useState<ItemRow[]>([{ rowId: nextRowId++, bem: null }])
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const allSelectedIds = rows.filter(r => r.bem).map(r => r.bem!.id)
    const unidadeId = unidade ? Number(unidade) : null

    const handleUnidadeChange = (value: string) => {
        setUnidade(value)
        setRows([{ rowId: nextRowId++, bem: null }])
    }

    const handleSelect = (rowId: number, bem: Bem) => {
        setRows(prev => prev.map(r => r.rowId === rowId ? { ...r, bem } : r))
    }

    const handleClear = (rowId: number) => {
        setRows(prev => prev.map(r => r.rowId === rowId ? { ...r, bem: null } : r))
    }

    const handleRemove = (rowId: number) => {
        setRows(prev => {
            if (prev.length === 1) return [{ rowId: nextRowId++, bem: null }]
            return prev.filter(r => r.rowId !== rowId)
        })
    }

    const handleAddRow = () => {
        setRows(prev => [...prev, { rowId: nextRowId++, bem: null }])
    }

    // ALTERADO: era handleSubmit com "Salvar". Agora é handleSolicitar com "Solicitar".
    // Não envia mais numero_processo_baixa nem data_baixa.
    const handleSolicitar = async () => {
        setError(null)

        if (!unidade) return setError("Selecione a unidade administrativa.")

        const itens = rows.filter(r => r.bem)
        if (itens.length === 0) return setError("Adicione ao menos um item.")

        setSubmitting(true)
        try {
            await baixaFisicaService.create({
                unidade_administrativa_origem: Number(unidade),
                itens: itens.map(r => ({ bem: r.bem!.id })),
            })
            navigate(-1)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erro ao solicitar."
            setError(message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="p-8 space-y-4">

            <AppBreadcrumb
                items={[
                    { label: "Bem Patrimonial" },
                    { label: "Baixas Físicas" },
                    { label: "Adicionar Baixa", isActive: true },
                ]}
            />

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-700">
                    Adicionar Baixa Física de Bem Patrimonial
                </h1>

                <div className="flex items-center gap-3">
                    <Button onClick={() => navigate(-1)} className={ACTION_BUTTON_CLASS}>
                        <ArrowLeft size={18} />
                    </Button>
                    {/* ALTERADO: "Salvar" → "Solicitar" */}
                    <Button
                        onClick={handleSolicitar}
                        disabled={submitting}
                        className="h-10 px-6 bg-[#2F7D57] text-white font-semibold rounded-md hover:bg-[#256947]"
                    >
                        {submitting ? "Solicitando..." : "Solicitar"}
                    </Button>
                    <Button onClick={() => navigate(-1)} className={ACTION_BUTTON_CLASS}>
                        Cancelar
                    </Button>
                </div>
            </div>

            {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-4 py-2" role="alert">
                    {error}
                </div>
            )}

            <Card className="p-6 space-y-6">

                {/* CAMPOS — apenas Unidade Administrativa */}
                {/* REMOVIDO: campos "Número do Processo de Baixa" e "Data da Baixa" */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="unidade-select" className="text-sm font-semibold text-gray-700">
                            Unidade Administrativa *
                        </label>
                        <UnidadeAdministrativaSelect
                            value={unidade}
                            onChange={handleUnidadeChange}
                            className="h-11 w-full rounded-xs border border-gray-300 px-3 text-sm text-gray-700 bg-white"
                        />
                    </div>
                </div>

                {/* ITENS */}
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-green-700">
                        Itens de Baixa Física
                    </p>

                    <div className="space-y-2">
                        {rows.map((row, index) => (
                            <BemSelectorRow
                                key={row.rowId}
                                row={row}
                                allSelectedIds={allSelectedIds}
                                unidadeId={unidadeId}
                                onSelect={handleSelect}
                                onClear={handleClear}
                                onRemove={handleRemove}
                                onAdd={handleAddRow}
                                isLast={index === rows.length - 1}
                            />
                        ))}
                    </div>
                </div>

            </Card>
        </div>
    )
}