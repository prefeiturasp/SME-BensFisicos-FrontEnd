import { z } from 'zod';

export const unidadeOrcamentariaFormSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, 'Código inicial é obrigatório')
    .regex(/^\d{2}\.\d{2}\.\d{2}$/, 'Informe o código no padrão 00.00.00.'),
  sigla: z
    .string()
    .trim()
    .max(255, 'Sigla da UO deve ter no máximo 255 caracteres.'),
  nome: z
    .string()
    .trim()
    .min(1, 'Nome da UO é obrigatório')
    .max(255, 'Nome da UO deve ter no máximo 255 caracteres.'),
  sigla_orgao: z
    .string()
    .trim()
    .max(255, 'Sigla do órgão deve ter no máximo 255 caracteres.'),
  orgao: z
    .string()
    .trim()
    .max(255, 'Nome do órgão deve ter no máximo 255 caracteres.'),
  codigo_orgao: z
    .string()
    .trim()
    .max(255, 'Código do órgão deve ter no máximo 255 caracteres.')
    .refine((value) => value.length === 0 || /^\d{2}\.\d{2}$/.test(value), {
      message: 'Informe o código do órgão no padrão 00.00.',
    }),
  status: z.enum(['ativa', 'inativa'], {
    error: 'Status é obrigatório',
  }),
});

export type UnidadeOrcamentariaFormData = z.infer<typeof unidadeOrcamentariaFormSchema>;