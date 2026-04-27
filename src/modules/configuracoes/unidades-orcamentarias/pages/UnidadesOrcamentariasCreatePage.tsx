import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UnidadesOrcamentariasGuard } from '../components/UnidadesOrcamentariasGuard';

const ACTION_BUTTON_CLASS =
  'h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors';

export default function UnidadesOrcamentariasCreatePage() {
  const navigate = useNavigate();

  return (
    <UnidadesOrcamentariasGuard>
      <div className='space-y-4 p-8' data-testid='unidades-orcamentarias-create'>
        <AppBreadcrumb
          items={[
            { label: 'Configurações', icon: Settings },
            { label: 'Unidades Orçamentárias', to: '/unidades-orcamentarias' },
            { label: 'Adicionar Unidade Orçamentária', isActive: true },
          ]}
        />

        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <h1 className='text-xl font-bold tracking-tight text-gray-700'>
            Adicionar Unidade Orçamentária
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
          <p className='text-sm font-semibold text-gray-700'>Página em branco preparada para a próxima etapa.</p>
          <p className='text-sm text-gray-500'>
            Esta rota foi criada apenas para manter a estrutura do módulo alinhada com Unidades
            Administrativas. O formulário de criação será implementado depois.
          </p>
        </Card>
      </div>
    </UnidadesOrcamentariasGuard>
  );
}