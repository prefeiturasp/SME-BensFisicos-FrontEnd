/**
 * Formatação padronizada de usuário responsável ("Criado por", "Fechado por", etc.).
 *
 * O formato canônico do sistema é o já adotado no módulo de Conciliações:
 *
 *     Nome Completo (RF 1234567)
 *
 * Regras de degradação (ver ADR em docs/criado-por.md):
 * - Nome + RF          -> "Nome Completo (RF 1234567)"
 * - Somente nome       -> "Nome Completo"
 * - Somente RF         -> "RF 1234567"
 * - Nenhuma informação -> INFORMACAO_INDISPONIVEL_LABEL (exceção conhecida — dado
 *   histórico não migrado). NUNCA inventar ou substituir por outro usuário.
 */

/**
 * Rótulo exibido quando não há qualquer informação de autoria.
 *
 * Propositalmente explícito: a ausência da informação é uma exceção conhecida
 * (registros anteriores à migração) e não deve ser mascarada com string vazia,
 * "-" ou com o usuário logado.
 */
export const INFORMACAO_INDISPONIVEL_LABEL =
  'Informação não disponível (registro anterior à migração)';

export interface UsuarioResponsavel {
  nome_completo?: string | null;
  nome?: string | null;
  username?: string | null;
  rf?: string | null;
}

function limpar(valor: string | null | undefined): string | null {
  const texto = valor?.trim();
  return texto || null;
}

/**
 * Monta o rótulo "Nome completo + RF" a partir dos campos separados.
 */
export function formatUsuarioLabel(
  nome: string | null | undefined,
  rf: string | null | undefined,
): string {
  const nomeLimpo = limpar(nome);
  const rfLimpo = limpar(rf);

  if (nomeLimpo && rfLimpo) {
    return `${nomeLimpo} (RF ${rfLimpo})`;
  }

  if (nomeLimpo) {
    return nomeLimpo;
  }

  if (rfLimpo) {
    return `RF ${rfLimpo}`;
  }

  return INFORMACAO_INDISPONIVEL_LABEL;
}

/**
 * Variante para os módulos em que o backend devolve o responsável como objeto
 * (Transferências, Baixas Físicas) em vez de campos achatados.
 *
 * `username` é usado como fallback de nome apenas quando `nome_completo`/`nome`
 * não vierem preenchidos — o username não é promovido a RF.
 */
export function formatUsuarioObjetoLabel(usuario: UsuarioResponsavel | null | undefined): string {
  if (!usuario) {
    return INFORMACAO_INDISPONIVEL_LABEL;
  }

  const nome = limpar(usuario.nome_completo) ?? limpar(usuario.nome) ?? limpar(usuario.username);

  return formatUsuarioLabel(nome, usuario.rf);
}

/**
 * Indica se o registro se enquadra na exceção conhecida de dado histórico
 * ausente. Útil para telas que queiram sinalizar visualmente (ícone/tooltip).
 */
export function isAutoriaIndisponivel(label: string): boolean {
  return label === INFORMACAO_INDISPONIVEL_LABEL;
}