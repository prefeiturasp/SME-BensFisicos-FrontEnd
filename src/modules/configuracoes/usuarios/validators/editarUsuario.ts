import z from "zod"

const senhaSchema = z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
        message: "A senha deve ter no mínimo 6 caracteres",
    })
    .refine((val) => !val || /[a-z]/.test(val), {
        message: "A senha deve conter pelo menos 1 letra",
    })
    .refine((val) => !val || /\d/.test(val), {
        message: "A senha deve conter pelo menos 1 número",
    })
    .refine((val) => !val || /[^A-Za-z0-9]/.test(val), {
        message: "A senha deve conter pelo menos 1 caractere especial",
    })

const editarUsuarioSchema = z
    .object({
        nome: z.string().min(1, "Nome é obrigatório"),
        rf: z.string().min(1, "RF é obrigatório"),
        email: z.email("E-mail inválido"),
        unidade: z.string().optional(),
        grupo: z.string().min(1, "Selecione um grupo"),
        status: z.string().min(1, "Selecione um status"),
        senha: senhaSchema,
        confirmarSenha: z.string().optional(),
    })
    // senha confirm
    .refine(
        (data) => !data.senha || data.senha === data.confirmarSenha,
        {
            message: "As senhas não coincidem",
            path: ["confirmarSenha"],
        }
    )
    .refine(
        (data) =>
            data.grupo !== "OPERADOR_INVENTARIO" || !!data.unidade,
        {
            message: "Unidade Administrativa é obrigatória para Operador",
            path: ["unidade"],
        }
    )

export type EditarUsuarioFormData = z.infer<typeof editarUsuarioSchema>
export { editarUsuarioSchema }