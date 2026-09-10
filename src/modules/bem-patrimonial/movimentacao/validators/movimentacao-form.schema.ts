import { z } from 'zod'

/**
 * Validação do formulário de Movimentação de Bem Patrimonial.
 *
 * A UA de destino só é exigida quando o destino é a mesma UO de origem — a
 * regra de obrigatoriedade é a mesma de antes, apenas expressa declarativamente
 * para que todas as pendências sejam acumuladas numa única submissão.
 *
 * Os campos `numero_de` / `numero_ate` pertencem à sub-ação "adicionar faixa" e
 * são validados no próprio fluxo, não neste schema.
 */
export const movimentacaoSchema = z
  .object({
    unidade_orcamentaria_destino: z
      .string()
      .min(1, 'Selecione a Unidade Orçamentária de destino.'),
    unidade_administrativa_destino: z.string().optional(),
    observacao: z.string().optional(),
    itens: z.array(z.number()).min(1, 'Adicione ao menos um item de movimentação.'),
    /** Preenchido pela página: indica se o destino é a mesma UO de origem. */
    destino_mesma_uo: z.boolean(),
    numero_de: z.string().optional(),
    numero_ate: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.destino_mesma_uo && !values.unidade_administrativa_destino) {
      ctx.addIssue({
        code: 'custom',
        path: ['unidade_administrativa_destino'],
        message: 'Selecione a Unidade Administrativa de destino.',
      })
    }
  })

export type MovimentacaoFormData = z.infer<typeof movimentacaoSchema>