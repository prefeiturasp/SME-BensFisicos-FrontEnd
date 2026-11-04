import { z } from 'zod'

import { isDataFutura } from '../utils/datas'

/**
 * Schemas de validação dos formulários de Baixas Físicas.
 *
 * O zod acumula todos os erros num único passe, o que garante o critério de
 * aceite de apresentar todos os campos pendentes simultaneamente — em vez do
 * comportamento anterior, que abortava na primeira pendência encontrada.
 */

export const adicionarBaixaSchema = z.object({
  unidade: z.string().min(1, 'Selecione a unidade administrativa.'),
  itens: z
    .array(z.number())
    .min(1, 'Adicione ao menos um item.'),
  /**
   * Opcional. A regra de "não pode ser futura" vive aqui para ser avaliada no
   * mesmo passe dos demais campos e aparecer no próprio campo, em vez de
   * abortar a validação e ir para o banner do topo.
   */
  data_baixa: z
    .date()
    .optional()
    .refine((valor) => !valor || !isDataFutura(valor), {
      message: 'Data da Baixa não pode ser futura.',
    }),
})

export type AdicionarBaixaFormData = z.infer<typeof adicionarBaixaSchema>

export const solicitarCorrecaoSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(1, 'Descreva as orientações para a correção antes de enviar.'),
})

export type SolicitarCorrecaoFormData = z.infer<typeof solicitarCorrecaoSchema>

export const gerarNbbpmSchema = z.object({
  numero_processo: z.string().trim().min(1, 'Informe o número do processo de Baixa.'),
  data_autorizacao: z.string().trim().min(1, 'Informe a data da autorização.'),
  responsavel: z.string().trim().min(1, 'Informe o responsável.'),
  numero_processo_destinacao_final: z.string().optional(),
})

export type GerarNbbpmFormData = z.infer<typeof gerarNbbpmSchema>
