// modals/ConfirmarAceiteModal.tsx
//
// Modal exibido ao clicar em "Aceitar" na tela "Validar Baixa", quando
// todos os itens já foram marcados como validados (conferência local,
// sem persistência no backend).

interface ConfirmarAceiteModalProps {
    readonly onConfirm: () => void
    readonly onCancel: () => void
    readonly loading?: boolean
}

export default function ConfirmarAceiteModal({
    onConfirm,
    onCancel,
    loading = false,
}: ConfirmarAceiteModalProps) {
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
                <div className="px-6 py-5">
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Ao realizar o aceite da solicitação, não será mais possível incluir
                        ou excluir itens na Baixa Física.
                    </p>
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
                        onClick={onConfirm}
                        disabled={loading}
                        className="h-10 px-5 rounded-md bg-[#2F7D57] text-white text-sm font-semibold hover:bg-[#256947] transition-colors disabled:opacity-60"
                    >
                        {loading ? "Confirmando..." : "Confirmar"}
                    </button>
                </div>
            </div>
        </div>
    )
}