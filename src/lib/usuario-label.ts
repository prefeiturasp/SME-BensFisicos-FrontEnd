/**
 * Formatação padronizada do responsável por um registro ("Criado por").
 *
 * Formato canônico do sistema, herdado do módulo de Conciliações:
 *
 *     Nome Completo (RF 1234567)
 *
 * ---------------------------------------------------------------------------
 * POR QUE A AUSÊNCIA NÃO TEM UM TEXTO ÚNICO
 * ---------------------------------------------------------------------------
 * O backend permite `criado_por` vazio por motivos diferentes em cada módulo.
 * Afirmar "registro anterior à migração" em todos os casos atribuiria uma causa
 * não comprovada e poderia mascarar uma falha atual de gravação. As regras
 * abaixo vêm dos modelos (`bem_patrimonial/models.py`, `inventario/models.py`):
 *
 * | Módulo          | FK criado_por        | Vazio significa         |
 * | --------------- | -------------------- | ----------------------- |
 * | Bem Patrimonial | SET_NULL, null=True  | causa indeterminada     |
 * | Conciliação     | PROTECT,  null=True  | criação automática      |
 * | Transferência   | PROTECT,  null=False | inconsistência de dados |
 * | Baixa Física    | PROTECT,  null=False | inconsistência de dados |
 *
 * - **Bem Patrimonial**: `SET_NULL` + `null=True` permitem três origens que a
 *   API não distingue — dado histórico sem autoria, usuário excluído com o
 *   vínculo anulado, ou criação automática. Texto neutro, sem atribuir causa.
 *
 * - **Conciliação**: `PROTECT` impede excluir usuário com conciliações, então
 *   nulo só ocorre quando nunca houve autor. A rotina automática grava
 *   `criado_por=None` explicitamente
 *   (`inventario/utils_conciliacao/conciliacao_automatica.py`). Origem
 *   conhecida, pode ser nomeada.
 *
 * - **Transferência** e **Baixa Física**: `null=False` — o autor é obrigatório
 *   e sempre gravado. Vazio aqui é inconsistência de dados, nunca histórico;
 *   o texto não deve sugerir migração.
 */

/** Texto neutro: a ausência é real, mas a causa não é determinável. */
export const AUTORIA_INDISPONIVEL_LABEL = 'Informação não disponível';

/** Origem conhecida: o sistema gerou o registro sem usuário responsável. */
export const AUTORIA_AUTOMATICA_LABEL = 'Criada automaticamente pelo sistema';

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
 *
 * Sem nenhuma informação, devolve o texto neutro — nunca uma causa presumida.
 * Para Conciliações, use `formatAutoriaConciliacao`.
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

  return AUTORIA_INDISPONIVEL_LABEL;
}

/**
 * Variante para os módulos em que o backend devolve o responsável como objeto
 * (Transferências, Baixas Físicas) em vez de campos achatados.
 *
 * `username` substitui o nome apenas quando `nome_completo` / `nome` não vierem
 * preenchidos — o username nunca é promovido a RF.
 */
export function formatUsuarioObjetoLabel(usuario: UsuarioResponsavel | null | undefined): string {
  if (!usuario) {
    return AUTORIA_INDISPONIVEL_LABEL;
  }

  const nome = limpar(usuario.nome_completo) ?? limpar(usuario.nome) ?? limpar(usuario.username);

  return formatUsuarioLabel(nome, usuario.rf);
}

/**
 * Rótulo de autoria para Conciliações.
 *
 * Aqui a ausência tem origem conhecida: o registro foi gerado pela rotina
 * automática. Nomear essa origem evita que o auditor leia o vazio como perda
 * de dado ou falha de gravação.
 *
 * @param geradaAutomaticamente registro nascido da rotina automática. Quando
 * falso, a ausência cai no texto neutro.
 */
export function formatAutoriaConciliacao(
  nome: string | null | undefined,
  rf: string | null | undefined,
  geradaAutomaticamente = false,
): string {
  const label = formatUsuarioLabel(nome, rf);

  if (label === AUTORIA_INDISPONIVEL_LABEL && geradaAutomaticamente) {
    return AUTORIA_AUTOMATICA_LABEL;
  }

  return label;
}

/** Indica que o rótulo representa ausência de autoria, de qualquer origem. */
export function isAutoriaIndisponivel(label: string): boolean {
  return label === AUTORIA_INDISPONIVEL_LABEL || label === AUTORIA_AUTOMATICA_LABEL;
}

/** Indica que o rótulo representa a origem conhecida de criação automática. */
export function isAutoriaAutomatica(label: string): boolean {
  return label === AUTORIA_AUTOMATICA_LABEL;
}
