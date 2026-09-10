import { z } from 'zod'

/**
 * Validação do formulário de Transferência de Bem Patrimonial.
 *
 * Todas as pendências são acumuladas num único passe do zod, de modo que a
 * submissão apresente simultaneamente todos os campos que precisam de correção.
 */
export const transferenciaSchema = z.object({
  unidade_orcamentaria_destino: z
    .string()
    .min(1, 'Selecione a Unidade Orçamentária de destino.'),
  numero_processo: z.string().trim().min(1, 'Informe o número do processo.'),
  observacao: z.string().optional(),
  itens: z.array(z.number()).min(1, 'Adicione ao menos um item de transferência.'),
})

export type TransferenciaFormData = z.infer<typeof transferenciaSchema>