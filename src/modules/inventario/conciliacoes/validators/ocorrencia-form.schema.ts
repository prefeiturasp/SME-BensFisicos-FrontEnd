import { z } from 'zod';

export const ocorrenciaFormSchema = z
  .object({
    situacao: z
      .string()
      .min(1, 'Selecione a situação da ocorrência.'),
    divergencia: z.string().trim().max(2000, 'Limite de caracteres excedido.').optional(),
    observacao: z.string().trim().max(2000, 'Limite de caracteres excedido.').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.situacao === 'divergente' && !data.divergencia?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['divergencia'],
        message: 'Descreva a divergência encontrada.',
      });
    }
  });

export type OcorrenciaFormData = z.infer<typeof ocorrenciaFormSchema>;
