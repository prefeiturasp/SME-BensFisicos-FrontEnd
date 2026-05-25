import { z } from "zod"
import { newPasswordSchema } from "./password" // ajuste o caminho se necessário

export const editarUsuarioSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  rf: z.string().min(1, "RF é obrigatório"),
  email: z.email("E-mail inválido"),
  grupo: z.string().min(1, "Grupo é obrigatório"),
  unidade: z.array(z.string()).default([]),
  status: z.enum(["ativo", "inativo"]),
  // Senha opcional na edição, mas quando preenchida, usa as mesmas regras da criação
  senha: z.union([
    z.literal(""),
    newPasswordSchema
  ]).optional(),
  confirmarSenha: z.string().optional(),
}).refine(
  (data) => {
    // Se senha preenchida, confirmarSenha deve coincidir
    if (data.senha && data.senha.length > 0) {
      return data.senha === data.confirmarSenha
    }
    return true
  },
  {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  }
).refine(
  (data) => {
    // Se grupo é OPERADOR_INVENTARIO, unidade é obrigatória
    if (data.grupo === "OPERADOR_INVENTARIO") {
      return data.unidade.length > 0
    }
    return true
  },
  {
    message: "Unidade Administrativa é obrigatória para Operador",
    path: ["unidade"],
  }
)

export type EditarUsuarioFormData = z.infer<typeof editarUsuarioSchema>
