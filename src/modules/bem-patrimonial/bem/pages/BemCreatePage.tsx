import { Boxes } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

export default function BemCreatePage() {
  return (
    <div className='space-y-4'>
      <AppBreadcrumb
        items={[
          { label: 'Bem Patrimonial', icon: Boxes },
          { label: 'Bens Patrimoniais', to: '/bens-patrimoniais' },
          { label: 'Adicionar Bem Patrimonial', isActive: true },
        ]}
      />

      <div className='flex flex-col gap-2'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>
          Adicionar Bem Patrimonial
        </h1>
      </div>

      <div className='border rounded-lg p-8 border-dashed flex justify-center items-center text-muted-foreground bg-muted/20 h-64'>
        Formulário de Criação de Bem
      </div>
    </div>
  );
}
