import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UnidadeOrcamentariaForm } from '../components/UnidadeOrcamentariaForm';
import { UnidadesOrcamentariasCreateBreadcrumb } from '../components/UnidadesOrcamentariasCreateBreadcrumb';
import { UnidadesOrcamentariasGuard } from '../components/UnidadesOrcamentariasGuard';
import { useUnidadeOrcamentariaCreate } from '../hooks/useUnidadeOrcamentaria';
import { handleUnidadeOrcamentariaBadRequestError } from '../utils/form-error-handler';
import {
  unidadeOrcamentariaFormSchema,
  type UnidadeOrcamentariaFormData,
} from '../validators/unidade-orcamentaria-form.schema';

const ACTION_BUTTON_CLASS =
  'h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors';

export default function UnidadesOrcamentariasCreatePage() {
  const navigate = useNavigate();
  const createUnidadeOrcamentaria = useUnidadeOrcamentariaCreate();

  const form = useForm<UnidadeOrcamentariaFormData>({
    resolver: zodResolver(unidadeOrcamentariaFormSchema),
    defaultValues: {
      codigo: '',
      sigla: '',
      nome: '',
      sigla_orgao: '',
      orgao: '',
      codigo_orgao: '',
      status: 'ativa',
    },
  });

  const handleSubmit = async (values: UnidadeOrcamentariaFormData) => {
    form.clearErrors('root.serverError');

    try {
      await createUnidadeOrcamentaria.mutateAsync({
        codigo: values.codigo.trim(),
        sigla: values.sigla.trim().toUpperCase(),
        nome: values.nome.trim().toUpperCase(),
        sigla_orgao: values.sigla_orgao.trim().toUpperCase(),
        orgao: values.orgao.trim().toUpperCase(),
        codigo_orgao: values.codigo_orgao.trim(),
        ativa: values.status === 'ativa',
      });

      toast.success('Cadastro realizado com sucesso!', {
        description: 'A Unidade Orçamentária foi cadastrada.',
      });

      navigate('/unidades-orcamentarias');
    } catch (error) {
      if (handleUnidadeOrcamentariaBadRequestError(error, form)) {
        return;
      }

      const message =
        error instanceof Error ? error.message : 'Erro ao cadastrar unidade orçamentária.';

      form.setError('root.serverError', { type: 'server', message });
      toast.error(message);
    }
  };

  return (
    <UnidadesOrcamentariasGuard>
      <div className='space-y-4 p-8' data-testid='unidades-orcamentarias-create'>
        <UnidadesOrcamentariasCreateBreadcrumb />

        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <h1 className='text-xl font-bold tracking-tight text-gray-700'>
            Adicionar Unidade Orçamentária
          </h1>

          <div className='flex items-center justify-end gap-3'>
            <Button
              type='button'
              className='h-10 px-6 bg-[#2F7D57] text-white hover:bg-[#256947] rounded-md'
              disabled={createUnidadeOrcamentaria.isPending}
              onClick={form.handleSubmit(handleSubmit)}
            >
              {createUnidadeOrcamentaria.isPending ? 'Salvando...' : 'Salvar'}
            </Button>

            <Button
              type='button'
              onClick={() => navigate('/unidades-orcamentarias')}
              className={ACTION_BUTTON_CLASS}
            >
              Cancelar
            </Button>
          </div>
        </div>

        <Card className='p-6'>
          <UnidadeOrcamentariaForm
            form={form}
            submitting={createUnidadeOrcamentaria.isPending}
            onSubmit={handleSubmit}
          />
        </Card>
      </div>
    </UnidadesOrcamentariasGuard>
  );
}