import { ListEnd } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

export default function BaixasListPage() {
  return (
    <div className='space-y-4'>
      <AppBreadcrumb
        items={[
          { label: 'Bem Patrimonial', icon: ListEnd },
          { label: 'Baixas Físicas', isActive: true },
        ]}
      />

      <h1 className='text-xl font-bold tracking-tight text-gray-700'>Baixas Físicas</h1>

      <div className='border rounded-lg p-8 border-dashed flex justify-center items-center text-muted-foreground bg-muted/20 h-64'>
        Lista de Baixas de Bens
      </div>
    </div>
  );
}
