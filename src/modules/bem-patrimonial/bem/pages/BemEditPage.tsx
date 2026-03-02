import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'

import { bemService, type Bem } from '../services/bem.service'
import { useAuth } from '@/auth/useAuth'
import { useNumeroPatrimonial } from '../hooks/useNumeroPatrimonial'

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

export default function BemEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [bem, setBem] = useState<Bem | null>(null)

  const form = useForm<Bem>({
    defaultValues: {} as Bem,
  })

  const status = form.watch('status')
  const numeroPatrimonial = form.watch('numero_patrimonial')
  const formatoAntigo = form.watch('numero_formato_antigo')
  const semNumeracao = form.watch('sem_numeracao')

  const numeroHook = useNumeroPatrimonial({
    valor: numeroPatrimonial || '',
    formatoAntigoInicial: formatoAntigo || false,
    semNumeracaoInicial: semNumeracao || false,
  })

  useEffect(() => {
    async function fetchBem() {
      try {
        const data = await bemService.retrieve(Number(id))
        setBem(data)
        form.reset(data)
      } catch {
        toast.error('Erro ao carregar bem')
        navigate('/bens-patrimoniais')
      } finally {
        setLoading(false)
      }
    }

    fetchBem()
  }, [id])

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="animate-spin mx-auto" />
      </div>
    )
  }

  if (!bem) return null

  const isGestor = user?.is_gestor_patrimonio
  const isBaixaFisica = status === 'baixa_fisica'
  const podeEditar = isGestor && !isBaixaFisica

  const onSubmit = async (values: Bem) => {
    try {
      await bemService.update(values.id, values)
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

            {/* STATUS */}
            <div className="flex justify-end">
              <div className="text-sm font-semibold text-green-700">
                Status: {bem.status_display}
              </div>
            </div>

            {/* PRIMEIRA LINHA */}
            <div className="grid grid-cols-[1fr_1.6fr_auto_auto] gap-8 items-start">

              {/* UNIDADE */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">
                  Unidade Administrativa
                </label>
                <Input
                  value={`${bem.unidade_administrativa_codigo} - ${bem.unidade_administrativa_nome}`}
                  disabled
                  className={INPUT_CLASS}
                />
              </div>

              {/* NÚMERO PATRIMONIAL */}
              <FormField
                control={form.control}
                name="numero_patrimonial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número Patrimonial</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={
                          !podeEditar ||
                          numeroHook.disabled
                        }
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

              {/* FORMATO ANTIGO */}
              <FormField
                control={form.control}
                name="numero_formato_antigo"
                render={({ field }) => (
                  <div className="pt-9">
                    <label className="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => {
                          field.onChange(e.target.checked)
                          numeroHook.handleFormatoAntigoChange(e.target.checked)
                        }}
                      />
                      Formato anterior
                    </label>
                  </div>
                )}
              />

              {/* SEM NUMERAÇÃO */}
              <FormField
                control={form.control}
                name="sem_numeracao"
                render={({ field }) => (
                  <div className="pt-9">
                    <label className="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => {
                          field.onChange(e.target.checked)
                          numeroHook.handleSemNumeracaoChange(e)
                        }}
                        disabled={!numeroHook.semNumeracao}
                      />
                      Sem número patrimonial
                    </label>
                  </div>
                )}
              />

            </div>

            {/* RESTANTE DOS CAMPOS */}
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
                    <FormItem className={fieldName === 'descricao' ? 'col-span-3' : ''}>
                      <FormLabel>
                        {fieldName.replaceAll('_', ' ').toUpperCase()}
                      </FormLabel>
                      <FormControl>
                        {fieldName === 'descricao' ? (
                          <textarea
                            {...field}
                            disabled={!podeEditar}
                            className="w-full border border-gray-300 rounded-xs px-4 py-3 text-sm min-h-[140px]"
                          />
                        ) : (
                          <Input
                            {...field}
                            disabled={!podeEditar || fieldName === 'numero_processo_baixa'}
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