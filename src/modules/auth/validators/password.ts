import { z } from 'zod';

export const PASSWORD_REQUIREMENTS = [
  'Sua nova senha não deve conter informações pessoais.',
  'Sua senha deve ter ao menos 6 caracteres.',
  'Sua senha deve conter letras, números e caracteres especiais.',
] as const;

export const newPasswordSchema = z
  .string()
  .min(6, 'A senha deve ter no mínimo 6 caracteres')
  .regex(/[a-zA-Z]/, 'A senha deve conter letras')
  .regex(/\d/, 'A senha deve conter números')
  .regex(/[^A-Za-z0-9]/, 'A senha deve conter caracteres especiais');

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Senha atual é obrigatória'),
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export const firstAccessPasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });
