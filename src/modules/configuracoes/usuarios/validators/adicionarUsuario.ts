import { z } from "zod";
import { newPasswordSchema } from "./password";

export const adicionarUsuarioSchema = z
  .object({
    nome: z.string().min(1, "Nome é obrigatório"),
    rf: z.string().min(1, "RF é obrigatório"),
    username: z.string().min(1, "Nome de usuário é obrigatório"),
    email: z.email("E-mail inválido"),
    unidade: z.string().min(1, "Selecione uma unidade administrativa"),
    grupo: z.string().min(1, "Selecione um grupo"),
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
    status: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type AdicionarUsuarioFormData = z.infer<typeof adicionarUsuarioSchema>;