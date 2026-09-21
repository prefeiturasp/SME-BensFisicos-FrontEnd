import { useState } from "react"
import { toast } from "sonner"

import {
    maskProcessoBaixa,
    isProcessoBaixaValido,
} from "../utils/processo-baixa"

export const CORRIGIR_PROCESSO_FORMATO_MSG =
    "Formato inválido. Use XXXX.XXXX/XXXXXXX-X (ex: 6016.2025/0117371-7)"
export const CORRIGIR_PROCESSO_OBRIGATORIO_MSG = "Número do processo é obrigatório."

interface CorrigirProcessoModalProps {
    readonly valorAtual: string | null
    readonly onConfirm: (numeroProcesso: string) => void
    readonly onCancel: () => void
    readonly loading?: boolean
}

export default function CorrigirProcessoModal({
    valorAtual,
    onConfirm,
    onCancel,
    loading = false,
}: CorrigirProcessoModalProps) {
    const [numeroProcesso, setNumeroProcesso] = useState(valorAtual ?? "")

    const trimmed = numeroProcesso.trim()
    const isValido = isProcessoBaixaValido(trimmed)
    const valorAtualNormalizado = (valorAtual ?? "").trim()
    const houveAlteracao = trimmed !== valorAtualNormalizado

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNumeroProcesso(maskProcessoBaixa(e.target.value))
    }

    const handleConfirm = () => {
        const valor = numeroProcesso.trim()
        if (!valor) {
            toast.error(CORRIGIR_PROCESSO_OBRIGATORIO_MSG)
            return
        }
        if (!isProcessoBaixaValido(valor)) {
            toast.error(CORRIGIR_PROCESSO_FORMATO_MSG)
            return
        }
        if (valor === (valorAtual ?? "").trim()) {
            return
        }
        onConfirm(valor)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-800">
                        Corrigir número do processo
                    </h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Fechar"
                    >
                        ✕
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Número atual:{" "}
                        <span className="font-semibold text-gray-800">
                            {valorAtual ?? "-"}
                        </span>
                    </p>
                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="numero-processo-corrigir"
                            className="text-sm font-semibold text-gray-700"
                        >
                            Novo número do processo *
                        </label>
                        <input
                            id="numero-processo-corrigir"
                            value={numeroProcesso}
                            onChange={handleChange}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleConfirm()
                            }}
                            placeholder="6016.2025/0117371-7"
                            maxLength={19}
                            disabled={loading}
                            className="h-10 w-full rounded border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2F7D57] focus:border-[#2F7D57] disabled:bg-gray-50"
                            aria-label="Novo número do processo"
                        />
                        <span className="text-xs text-gray-400">
                            Formato: XXXX.XXXX/XXXXXXX-X
                        </span>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="h-10 px-5 rounded-md border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading || !isValido || !houveAlteracao}
                        className="h-10 px-5 rounded-md bg-[#2F7D57] text-white text-sm font-semibold hover:bg-[#256947] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? "Salvando..." : "Salvar"}
                    </button>
                </div>
            </div>
        </div>
    )
}
