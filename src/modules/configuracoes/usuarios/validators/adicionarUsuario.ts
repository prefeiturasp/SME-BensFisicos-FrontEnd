import { z } from "zod"
import { newPasswordSchema } from "./password"

export const adicionarUsuarioSchema = z
  .object({
    nome: z.string({ error: "Nome é obrigatório" }).min(1, "Nome é obrigatório"),
    rf: z.string({ error: "RF é obrigatório" }).min(1, "RF é obrigatório"),
    username: z.string({ error: "Nome de usuário é obrigatório" }).min(1, "Nome de usuário é obrigatório"),
    email: z.email({ error: "E-mail inválido" }),
    unidade: z.array(z.string()).default([]),
    grupo: z.string({ error: "Selecione um grupo" }).min(1, "Selecione um grupo"),
    password: newPasswordSchema,
    confirmPassword: z.string({ error: "Confirmação de senha é obrigatória" }).min(1, "Confirmação de senha é obrigatória"),
    status: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      // UA obrigatória apenas para Operador
      // Gestor pode não ter UA — a UO virá do próprio perfil do usuário logado
      if (data.grupo === "OPERADOR_INVENTARIO") {
        return data.unidade.length > 0
      }
      return true
    },
    {
      message: "Unidade Administrativa é obrigatória para Operadores",
      path: ["unidade"],
    }
  )

export type AdicionarUsuarioFormData = z.infer<typeof adicionarUsuarioSchema>
