import { Network } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

export default function MovimentacoesListPage() {
  return (
    <div className='space-y-4'>
      <AppBreadcrumb
        items={[
          { label: 'Bem Patrimonial', icon: Network },
          { label: 'Movimentações', isActive: true },
        ]}
      />

      <h1 className='text-xl font-bold tracking-tight text-gray-700'>
        Movimentações de Bem Patrimonial
      </h1>

      <div className='border rounded-lg p-8 border-dashed flex justify-center items-center text-muted-foreground bg-muted/20 h-64'>
        Histórico e Gestão de Movimentações
      </div>
    </div>
  );
}
