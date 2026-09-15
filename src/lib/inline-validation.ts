import type {
  FieldPath,
  FieldValues,
  PathValue,
  UseFormReturn,
} from 'react-hook-form'

/**
 * Padrão único de limpeza de erro inline (referência: Unidades Orçamentárias e
 * Administrativas).
 *
 * `definirCampoValidado` atualiza um campo controlado fora do `FormField` e
 * revalida APENAS esse campo — e somente depois da primeira submissão, para
 * que a tela não acuse pendência antes do usuário tentar salvar. Nenhum erro
 * de outro campo é apagado junto.
 */
export function definirCampoValidado<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>(
  form: UseFormReturn<TFieldValues>,
  name: TName,
  value: PathValue<TFieldValues, TName>,
) {
  form.setValue(name, value, {
    shouldValidate: form.formState.isSubmitted,
    shouldDirty: true,
  })
  limparErroServidor(form)
}

/**
 * Limpa somente o erro de servidor (`root.serverError`), exibido no banner do
 * topo. Erros de campo continuam sob responsabilidade do resolver.
 */
export function limparErroServidor<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
) {
  form.clearErrors('root.serverError')
}
