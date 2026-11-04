import { CircleAlert } from "lucide-react"

type BannerErrosValidacaoProps = Readonly<{
    /**
     * Mensagens de validação consolidadas. O banner some automaticamente
     * quando a lista fica vazia — ou seja, quando todas as pendências
     * impeditivas foram corrigidas.
     */
    mensagens: string[]
    /** Mensagem de introdução exibida acima da lista de pendências. */
    titulo?: string
}>

/**
 * Banner consolidado de erros de validação do fluxo de Baixa Física.
 *
 * Complementa — não substitui — as validações de campo (borda, label e
 * mensagem inline continuam sendo exibidas pelo `FormMessage` de cada
 * campo). Este componente apenas resume, no topo da tela, todas as
 * pendências que impedem a continuidade do processo.
 */
export function BannerErrosValidacao({
    mensagens,
    titulo = "Existem pendências que precisam ser corrigidas antes de continuar.",
}: BannerErrosValidacaoProps) {
    if (mensagens.length === 0) return null

    return (
        <div
            role="alert"
            data-testid="banner-erros-validacao"
            className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3"
        >
            <CircleAlert className="size-5 shrink-0 text-red-600 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
                <p className="text-sm font-semibold text-red-700">{titulo}</p>
                <ul className="list-disc space-y-0.5 pl-5">
                    {mensagens.map((mensagem) => (
                        <li key={mensagem} className="text-sm text-red-600">
                            {mensagem}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
