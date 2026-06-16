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
// HOOK INTERNO — UAs do escopo do usuário logado
// ============================================================================

function useUnidadesDoEscopo(): UnidadeAdministrativa[] {
    const { user } = useAuth()

    return useMemo(() => {
        const grupos = user?.opcoes_escopo?.grupos ?? []

        // Cada grupo tem uma UO e uma lista de UAs.
        // Extraímos todas as UAs de todos os grupos e removemos duplicatas por id.
        const todas = grupos.flatMap(grupo =>
            grupo.uas.map(ua => ({
                id: ua.unidade_administrativa_id,
                nome: ua.nome,
                sigla: ua.label,   // label já vem como "CODIGO - SIGLA"
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

function useTodasUnidades(): UnidadeAdministrativa[] {
    const [unidades, setUnidades] = useState<UnidadeAdministrativa[]>([])

    useEffect(() => {
        unidadesAdministrativasService
            .list({ pageSize: 200 })
            .then((res: { results: UnidadeAdministrativa[] }) => setUnidades(res.results))
            .catch(() => {})
    }, [])

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
    // Cada hook é chamado sempre — a condicional é apenas no uso do resultado.
    const unidadesEscopo = useUnidadesDoEscopo()
    const todasUnidades = useTodasUnidades()

    // Se scopedToUser, usa os dados do /me (sem request extra).
    // Caso contrário, usa a listagem completa.
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