import { z } from 'zod';

export const unidadeAdministrativaFormSchema = z.object({
  codigoFinal: z
    .string()
    .min(1, 'Código final é obrigatório')
    .regex(/^\d{3}$/, 'Informe exatamente 3 dígitos numéricos.'),
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

export type UnidadeAdministrativaFormData = z.infer<typeof unidadeAdministrativaFormSchema>;
