import { z } from 'zod';

const yearSchema = z
  .string()
  .regex(/^\d{4}$/, 'Ano da conciliação anual ao qual este parâmetro se refere.');

const dateRegex = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

function parseDate(value: string) {
  const [day, month, year] = value.split('/').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

const dateSchema = z
  .string()
  .regex(dateRegex, 'Informe uma data válida no formato dd/mm/aaaa.')
  .refine((value) => parseDate(value) !== null, {
    message: 'Informe uma data válida no formato dd/mm/aaaa.',
  });

export const parametroConciliacaoAnualSchema = z
  .object({
    anoReferencia: yearSchema,
    periodoInicial: dateSchema,
    periodoFinal: dateSchema,
    ativo: z.boolean(),
  })
  .refine((data) => {
    const inicio = parseDate(data.periodoInicial);
    const fim = parseDate(data.periodoFinal);
    return Boolean(inicio && fim && inicio <= fim);
  }, {
    path: ['periodoFinal'],
    message: 'Data final em que conciliações anuais podem ser criadas/fechadas.',
  });

export type ParametroConciliacaoAnualFormData = z.infer<
  typeof parametroConciliacaoAnualSchema
>;
