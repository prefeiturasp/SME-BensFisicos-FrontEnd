import type { User } from '@/auth/auth.service'
import type { Bem } from '../services/bem.service'

const normalizeText = (value?: string | null) =>
  value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? ''

const buildBemCandidates = (
  bem: Pick<Bem, 'unidade_administrativa_codigo' | 'unidade_administrativa_nome'>,
) =>
  [
    bem.unidade_administrativa_codigo,
    bem.unidade_administrativa_nome,
    `${bem.unidade_administrativa_codigo} - ${bem.unidade_administrativa_nome}`,
  ]
    .map(normalizeText)
    .filter(Boolean)

const buildUaCandidates = (codigo?: string | null, nome?: string | null, label?: string | null) =>
  [codigo, nome, label, codigo && nome ? `${codigo} - ${nome}` : null]
    .map(normalizeText)
    .filter(Boolean)

export function userHasAccessToBemUa(
  user: User | null | undefined,
  bem: Pick<Bem, 'unidade_administrativa_codigo' | 'unidade_administrativa_nome'>,
) {
  if (!user?.is_gestor_patrimonio) return false

  const bemCandidates = buildBemCandidates(bem)
  if (bemCandidates.length === 0) return false

  return (user.opcoes_escopo?.grupos ?? []).some((grupo) =>
    (grupo.uas ?? []).some((ua) =>
      buildUaCandidates(ua.codigo, ua.nome, ua.label).some((candidate) =>
        bemCandidates.includes(candidate),
      ),
    ),
  )
}
