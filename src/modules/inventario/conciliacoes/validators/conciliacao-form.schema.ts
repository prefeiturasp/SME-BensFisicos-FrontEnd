import { z } from 'zod';

const dateRegex = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

function parseDate(value: string) {
  const [day, month, year] = value.split('/').map(Number);

  if (!day || !month || !year) {
    return null;
  }

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

export const conciliacaoFormSchema = z.object({
  periodoFinal: z
    .string()
    .min(1, 'Data final do período da conciliação é obrigatória.')
    .regex(dateRegex, 'Informe uma data válida no formato dd/mm/aaaa.')
    .refine((value) => parseDate(value) !== null, {
      message: 'Informe uma data válida no formato dd/mm/aaaa.',
    }),
});

export type ConciliacaoFormData = z.infer<typeof conciliacaoFormSchema>;
