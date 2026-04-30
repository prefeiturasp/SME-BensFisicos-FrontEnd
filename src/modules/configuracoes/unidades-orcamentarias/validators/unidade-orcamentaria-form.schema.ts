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
    .min(1, 'Sigla é obrigatória')
    .max(255, 'Sigla deve ter no máximo 255 caracteres.'),
  nome: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres.'),
  status: z.enum(['ativa', 'inativa'], {
    error: 'Status é obrigatório',
  }),
});

export type UnidadeOrcamentariaFormData = z.infer<typeof unidadeOrcamentariaFormSchema>;