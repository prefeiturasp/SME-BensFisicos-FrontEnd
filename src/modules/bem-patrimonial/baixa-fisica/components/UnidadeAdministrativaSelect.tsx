import { useEffect, useState, type SetStateAction } from "react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { unidadesAdministrativasService } from "../../../configuracoes/unidades-administrativas/services/unidades-administrativas.service"

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
}

export function UnidadeAdministrativaSelect({
    id,
    value,
    onChange,
    placeholder = "Selecione uma unidade",
    className = "h-10 w-full rounded-xs border border-gray-300 px-3 text-sm text-gray-700 bg-white",
    includeAll = false,
}: UnidadeAdministrativaSelectProps) {
    const [unidades, setUnidades] = useState<UnidadeAdministrativa[]>([])

    useEffect(() => {
        unidadesAdministrativasService
            .list({ pageSize: 200 })
            .then((res: { results: SetStateAction<UnidadeAdministrativa[]> }) => setUnidades(res.results))
            .catch(() => {})
    }, [])

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