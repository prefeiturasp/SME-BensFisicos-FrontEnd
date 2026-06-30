import { ArrowLeft, ListOrdered, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const ACTION_BUTTON_CLASS = `
  h-10 px-6 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white font-semibold rounded-md transition-colors
`;

const ICON_BUTTON_CLASS = `
  h-10 w-10 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white rounded-md transition-colors
  flex items-center justify-center
`;

export default function GerenciamentoConciliacoesListPage() {
  const navigate = useNavigate();

  return (
    <div className='space-y-4 p-8' data-testid='gerenciamento-conciliacoes-list'>
      <AppBreadcrumb
        items={[
          { label: 'Inventário', icon: ListOrdered },
          { label: 'Gerenciamento de Conciliações', isActive: true },
        ]}
      />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>
          Gerenciamento de Conciliações
        </h1>

        <div className='flex flex-wrap items-center justify-end gap-3'>
          <Button
            type='button'
            aria-label='Voltar'
            onClick={() => navigate(-1)}
            className={ICON_BUTTON_CLASS}
          >
            <ArrowLeft size={18} />
          </Button>

          <Button
            type='button'
            onClick={() => navigate('/conciliacoes/novo')}
            className={ACTION_BUTTON_CLASS}
          >
            <Plus size={16} className='mr-1' />
            Adicionar Conciliação
          </Button>
        </div>
      </div>

      <Card className='flex min-h-[480px] items-center justify-center p-6'>
        <p className='text-sm text-gray-500'>A listagem de conciliações será exibida nesta área.</p>
      </Card>
    </div>
  );
}
