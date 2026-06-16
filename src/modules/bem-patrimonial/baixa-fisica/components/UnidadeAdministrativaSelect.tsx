import { useMemo, useEffect, useState } from "react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useAuth } from "@/auth/useAuth"
import { unidadesAdministrativasService } from "../../../configuracoes/unidades-administrativas/services/unidades-administrativas.service"

// ============================================================================
// TYPES
// ============================================================================

interface UnidadeAdministrativa {
    readonly id: number
    readonly nome: string
    readonly sigla: string
    readonly codigo: string
}

interface UnidadeAdministrativaSelectProps {
    readonly id?: string
    readonly value: string
    readonly onChange: (value: string) => void
    readonly placeholder?: string
    readonly className?: string
    readonly includeAll?: boolean
    /**
     * Quando true, popula a lista a partir do escopo do usuário logado
     * (dados já disponíveis no /me — sem chamada extra à API).
     * Quando false (default), busca todas as UAs via serviço (uso em filtros gerais).
     */
    readonly scopedToUser?: boolean
}

// ============================================================================
// HOOK INTERNO — UAs do escopo do usuário logado (/me)
// ============================================================================

function useUnidadesDoEscopo(): UnidadeAdministrativa[] {
    const { user } = useAuth()

    return useMemo(() => {
        const grupos = user?.opcoes_escopo?.grupos ?? []

        const todas = grupos.flatMap(grupo =>
            grupo.uas.map(ua => ({
                id: ua.unidade_administrativa_id,
                nome: ua.nome,
                sigla: ua.label,
                codigo: ua.codigo,
            }))
        )

        // Remove duplicatas (mesma UA pode aparecer em mais de um grupo)
        const vistas = new Set<number>()
        return todas.filter(ua => {
            if (vistas.has(ua.id)) return false
            vistas.add(ua.id)
            return true
        })
    }, [user?.opcoes_escopo?.grupos])
}

// ============================================================================
// HOOK INTERNO — Todas as UAs via serviço (filtros gerais/admin)
// ============================================================================

function useTodasUnidades(enabled: boolean): UnidadeAdministrativa[] {
    const [unidades, setUnidades] = useState<UnidadeAdministrativa[]>([])

    useEffect(() => {
        // CORRIGIDO: só faz o request quando habilitado (scopedToUser=false)
        if (!enabled) return

        unidadesAdministrativasService
            .list({ pageSize: 200 })
            .then((res: { results: UnidadeAdministrativa[] }) => setUnidades(res.results))
            .catch(() => {})
    }, [enabled])

    return unidades
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function UnidadeAdministrativaSelect({
    id,
    value,
    onChange,
    placeholder = "Selecione uma unidade",
    className = "h-10 w-full rounded-xs border border-gray-300 px-3 text-sm text-gray-700 bg-white",
    includeAll = false,
    scopedToUser = false,
}: UnidadeAdministrativaSelectProps) {
    const unidadesEscopo = useUnidadesDoEscopo()
    // Passa enabled=false quando scopedToUser=true — nenhum request é feito
    const todasUnidades = useTodasUnidades(!scopedToUser)

    const unidades = scopedToUser ? unidadesEscopo : todasUnidades

    const handleChange = (val: string) => {
        onChange(val === "__all__" ? "" : val)
    }

    const selectValue = value || (includeAll ? "__all__" : "__none__")

    return (
        <Select value={selectValue} onValueChange={handleChange}>
            <SelectTrigger id={id} className={className}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {includeAll && (
                    <SelectItem value="__all__">Todas as unidades</SelectItem>
                )}
                {!includeAll && (
                    <SelectItem value="__none__">{placeholder}</SelectItem>
                )}
                {unidades.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>
                        {u.codigo} - {u.sigla}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}