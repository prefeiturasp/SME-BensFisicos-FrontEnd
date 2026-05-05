import { Settings } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UnidadesOrcamentariasGuard } from '../components/UnidadesOrcamentariasGuard';

const ACTION_BUTTON_CLASS =
  'h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors';

export default function UnidadesOrcamentariasViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const unidadeId = Number(id);
  const hasValidId = Number.isInteger(unidadeId) && unidadeId > 0;

  return (
    <UnidadesOrcamentariasGuard>
      <div className='space-y-4 p-8' data-testid='unidades-orcamentarias-view'>
        <AppBreadcrumb
          items={[
            { label: 'Configurações', icon: Settings },
            { label: 'Unidades Orçamentárias', to: '/unidades-orcamentarias' },
            { label: 'Visualizar Unidade Orçamentária', isActive: true },
          ]}
        />

        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <h1 className='text-xl font-bold tracking-tight text-gray-700'>
            Visualizar Unidade Orçamentária
          </h1>

          <Button
            type='button'
            onClick={() => navigate('/unidades-orcamentarias')}
            className={ACTION_BUTTON_CLASS}
          >
            Voltar
          </Button>
        </div>

        <Card className='space-y-3 p-6'>
          {!hasValidId && (
            <p className='text-sm text-red-700'>Identificador da Unidade Orçamentária inválido.</p>
          )}

          {hasValidId && (
            <>
              <p className='text-sm font-semibold text-gray-700'>Página em branco preparada para a próxima etapa.</p>
              <p className='text-sm text-gray-500'>
                A edição e o histórico desta UO ficarão concentrados nesta página, seguindo o padrão
                usado no módulo de Unidades Administrativas.
              </p>
              <p className='text-sm text-gray-500'>ID recebido da rota: {unidadeId}</p>
            </>
          )}
        </Card>
      </div>
    </UnidadesOrcamentariasGuard>
  );
}