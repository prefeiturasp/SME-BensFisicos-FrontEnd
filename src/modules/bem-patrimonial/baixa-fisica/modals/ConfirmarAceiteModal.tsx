// modals/ConfirmarAceiteModal.tsx
//
// Modal exibido ao clicar em "Aceitar" na tela "Validar Baixa", quando
// todos os itens já foram marcados como validados (conferência local,
// sem persistência no backend).
// Agora exige o Número do Processo com máscara 6016.2025/0117371-7
// padrão XXXX.XXXX/XXXXXXX-X e validação obrigatória com toast.

import { useState } from "react"
import { toast } from "sonner"

import {
    maskProcessoBaixa,
    isProcessoBaixaValido,
} from "../utils/processo-baixa"

interface ConfirmarAceiteModalProps {
    readonly onConfirm: (numeroProcesso: string) => void
    readonly onCancel: () => void
    readonly loading?: boolean
}

export default function ConfirmarAceiteModal({
    onConfirm,
    onCancel,
    loading = false,
}: ConfirmarAceiteModalProps) {
    const [numeroProcesso, setNumeroProcesso] = useState("")

    const isValido = isProcessoBaixaValido(numeroProcesso)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = maskProcessoBaixa(e.target.value)
        setNumeroProcesso(masked)
    }

    const handleConfirm = () => {
        const trimmed = numeroProcesso.trim()
        if (!trimmed) {
            toast.error("Número do Processo é obrigatório")
            return
        }
        if (!isProcessoBaixaValido(trimmed)) {
            toast.error(
                "Número do Processo fora do padrão XXXX.XXXX/XXXXXXX-X. Exemplo: 6016.2025/0117371-7"
            )
            return
        }
        onConfirm(trimmed)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-800">
                        Confirmar geração de laudo de Baixa Física
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

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Ao realizar o aceite da solicitação, não será mais possível incluir
                        ou excluir itens na Baixa Física.
                    </p>
                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="numero-processo-baixa"
                            className="text-sm font-semibold text-gray-700"
                        >
                            Número do Processo *
                        </label>
                        <input
                            id="numero-processo-baixa"
                            value={numeroProcesso}
                            onChange={handleChange}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleConfirm()
                            }}
                            placeholder="6016.2025/0117371-7"
                            maxLength={19}
                            disabled={loading}
                            className="h-10 w-full rounded border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2F7D57] focus:border-[#2F7D57] disabled:bg-gray-50"
                            aria-label="Número do Processo"
                        />
                        <span className="text-xs text-gray-400">
                            Formato: XXXX.XXXX/XXXXXXX-X
                        </span>
                    </div>
                </div>

                {/* Footer */}
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
                        disabled={loading || !isValido}
                        className="h-10 px-5 rounded-md bg-[#2F7D57] text-white text-sm font-semibold hover:bg-[#256947] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? "Confirmando..." : "Confirmar"}
                    </button>
                </div>
            </div>
        </div>
    )
}
