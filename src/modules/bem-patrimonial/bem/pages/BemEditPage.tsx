import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'

import { bemService, type Bem } from '../services/bem.service'
import { useAuth } from '@/auth/useAuth'
import { useNumeroPatrimonial } from '../hooks/useNumeroPatrimonial'
import { userHasAccessToBemUa } from '../utils/bemAccess'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'

const INPUT_CLASS =
  'h-11 w-full border border-gray-300 rounded-xs px-4 text-sm text-gray-700'

const NUMERO_PATRIMONIAL_REGEX = /^\d{3}\.\d{9}-\d$/

function isNumeroPatrimonialValido(values: Bem): boolean {
  if (values.sem_numeracao) return true
  if (values.numero_formato_antigo) return true

  const numero = values.numero_patrimonial ?? ''

  return NUMERO_PATRIMONIAL_REGEX.test(numero)
}

export default function BemEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [bem, setBem] = useState<Bem | null>(null)

  const [originalNome, setOriginalNome] = useState('')
  const [originalNumeroPatrimonial, setOriginalNumeroPatrimonial] = useState('')

  const form = useForm<Bem>({
    defaultValues: { justificativa: '' } as Bem,
  })

  const status = form.watch('status')
  const numeroPatrimonial = form.watch('numero_patrimonial')
  const formatoAntigo = form.watch('numero_formato_antigo')
  const semNumeracao = form.watch('sem_numeracao')
  const nomeAtual = form.watch('nome')
  const justificativa = (form.watch('justificativa' as any) as string) ?? ''

  const numeroHook = useNumeroPatrimonial({
    valor: numeroPatrimonial ?? '',
    formatoAntigoInicial: formatoAntigo ?? false,
    semNumeracaoInicial: semNumeracao ?? false,
  })

  const nomeAlterado = !!originalNome && nomeAtual !== originalNome
  const numeroAlterado =
    (numeroPatrimonial ?? '') !== (originalNumeroPatrimonial ?? '')

  const justificativaHabilitada = nomeAlterado || numeroAlterado
  const justificativaObrigatoria = justificativaHabilitada

  useEffect(() => {
    async function fetchBem() {
      try {
        const data = await bemService.retrieve(Number(id))

        setBem(data)
        form.reset({ ...data, justificativa: '' })
        setOriginalNome(data.nome ?? '')
        setOriginalNumeroPatrimonial(data.numero_patrimonial ?? '')
      } catch {
        toast.error('Erro ao carregar bem')
        navigate('/bens-patrimoniais')
      } finally {
        setLoading(false)
      }
    }

    fetchBem()
  }, [id, form, navigate])

  const isGestor = user?.is_gestor_patrimonio
  const isBaixaFisica = status === 'baixa_fisica'
  const podeEditarEscopo = bem ? userHasAccessToBemUa(user, bem) : false
  const podeEditar = !!isGestor && !isBaixaFisica && podeEditarEscopo

  useEffect(() => {
    if (!loading && bem && !podeEditar) {
      navigate(`/bens-patrimoniais/${bem.id}`, { replace: true })
    }
  }, [loading, bem, podeEditar, navigate])

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="animate-spin mx-auto" />
      </div>
    )
  }

  if (!bem) return null

  const onSubmit = async (values: Bem) => {
    const houveAlteracaoNumero =
      (values.numero_patrimonial ?? '') !== (originalNumeroPatrimonial ?? '')

    if (houveAlteracaoNumero && !isNumeroPatrimonialValido(values)) {
      form.setError('numero_patrimonial' as any, {
        message: 'Número patrimonial inválido. Use o formato 000.000000000-0.',
      })

      return
    }

    /*
      Importante:
      Quando o número patrimonial foi alterado, não bloqueamos no frontend
      por falta de justificativa antes da chamada à API.

      Isso preserva a paridade com o fluxo do Django Admin e permite que
      erros críticos do número patrimonial, como duplicidade, sejam retornados
      pelo backend em vez de serem mascarados pela justificativa.
    */
    const deveBloquearPorJustificativaNoFrontend =
      justificativaObrigatoria && !houveAlteracaoNumero && !justificativa.trim()

    if (deveBloquearPorJustificativaNoFrontend) {
      form.setError('justificativa' as any, {
        message:
          'Justificativa é obrigatória quando Nome ou Número Patrimonial são alterados.',
      })

      return
    }

    try {
      await bemService.update(values.id, {
        ...values,
        justificativa: justificativaHabilitada ? justificativa : '',
      } as any)

      toast.success('Bem atualizado com sucesso')
      navigate(`/bens-patrimoniais/${values.id}`)
    } catch (error: any) {
      if (error.response?.data) {
        Object.entries(error.response.data).forEach(([field, message]) => {
          form.setError(field as any, {
            message: String(message),
          })
        })
      } else {
        toast.error('Erro ao salvar')
      }
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#363636]">
            Editar Bem Patrimonial
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Atualize as informações do bem cadastrado
          </p>
        </div>

        <Button
          variant="outline"
          className="h-10 border-gray-300 text-gray-700"
          onClick={() => navigate(`/bens-patrimoniais/${bem.id}`)}
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar
        </Button>
      </div>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex justify-end">
              <div className="text-sm font-semibold text-green-700">
                Status: {bem.status_display}
              </div>
            </div>

            <div className="grid grid-cols-[1fr_1.6fr_auto_auto] gap-8 items-start">
              <div className="space-y-1">
                <label
                  htmlFor="unidade_administrativa"
                  className="text-sm font-semibold text-gray-700"
                >
                  Unidade Administrativa
                </label>
                <Input
                  id="unidade_administrativa"
                  value={`${bem.unidade_administrativa_codigo} - ${bem.unidade_administrativa_nome}`}
                  disabled
                  className={INPUT_CLASS}
                />
              </div>

              <FormField
                control={form.control}
                name="numero_patrimonial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número Patrimonial</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        disabled={!podeEditar || numeroHook.disabled}
                        className={INPUT_CLASS}
                        onChange={(e) => {
                          const masked = numeroHook.applyMask(e.target.value)
                          field.onChange(masked)
                        }}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      Formato padrão: 000.000000000-0
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numero_formato_antigo"
                render={({ field }) => (
                  <FormItem className="pt-9">
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <input
                          id="numero_formato_antigo"
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => {
                            field.onChange(e.target.checked)
                            if (e.target.checked) {
                              numeroHook.ativarFormatoAntigo()
                            } else {
                              numeroHook.desativarFormatoAntigo()
                            }
                          }}
                          disabled={!podeEditar}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="numero_formato_antigo"
                        className="text-sm text-gray-700 whitespace-nowrap"
                      >
                        Formato anterior
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sem_numeracao"
                render={({ field }) => (
                  <FormItem className="pt-9">
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <input
                          id="sem_numeracao"
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => {
                            field.onChange(e.target.checked)
                            numeroHook.handleSemNumeracaoChange(e.target.checked)
                          }}
                          disabled={!podeEditar}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="sem_numeracao"
                        className="text-sm text-gray-700 whitespace-nowrap"
                      >
                        Sem número patrimonial
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-6">
              {[
                'nome',
                'descricao',
                'valor_unitario',
                'marca',
                'modelo',
                'localizacao',
                'numero_processo',
                'numero_processo_baixa',
              ].map((fieldName) => (
                <FormField
                  key={fieldName}
                  control={form.control}
                  name={fieldName as any}
                  render={({ field }) => (
                    <FormItem
                      className={fieldName === 'descricao' ? 'col-span-3' : ''}
                    >
                      <FormLabel>
                        {fieldName.replaceAll('_', ' ').toUpperCase()}
                      </FormLabel>
                      <FormControl>
                        {fieldName === 'descricao' ? (
                          <textarea
                            {...field}
                            disabled={!podeEditar}
                            className="w-full border border-gray-300 rounded-xs px-4 py-3 text-sm min-h-35"
                          />
                        ) : (
                          <Input
                            {...field}
                            value={field.value ?? ''}
                            disabled={
                              !podeEditar ||
                              fieldName === 'numero_processo_baixa'
                            }
                            className={INPUT_CLASS}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <FormField
              control={form.control}
              name={'observacao' as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OBSERVAÇÃO</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      disabled={!podeEditar}
                      placeholder="Observação"
                      className="w-full border border-gray-300 rounded-xs px-4 py-3 text-sm min-h-25 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* JUSTIFICATIVA */}
            <FormField
              control={form.control}
              name={'justificativa' as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    JUSTIFICATIVA
                    {justificativaObrigatoria && (
                      <span className="text-red-500"> *</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      disabled={!podeEditar || !justificativaHabilitada}
                      placeholder={
                        justificativaHabilitada
                          ? 'Justificativa para a alteração'
                          : 'Habilitado ao alterar Nome do Bem ou Número Patrimonial'
                      }
                      className={`w-full border rounded-xs px-4 py-3 text-sm min-h-25 disabled:opacity-50 disabled:cursor-not-allowed ${
                        form.formState.errors.justificativa
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {podeEditar && (
              <div className="flex justify-end pt-6 border-t">
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="h-11 bg-[#00703C] hover:bg-[#005a30] text-white font-semibold px-8"
                >
                  {form.formState.isSubmitting
                    ? 'Salvando...'
                    : 'Salvar Edição'}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </Card>
    </div>
  )
}
