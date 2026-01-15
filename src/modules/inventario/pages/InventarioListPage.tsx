import { ListOrdered } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

export default function InventarioListPage() {
  return (
    <div className='space-y-4'>
      <AppBreadcrumb
        items={[
          { label: 'Inventário', icon: ListOrdered },
          { label: 'Inventários', isActive: true },
        ]}
      />

      <h1 className='text-xl font-bold tracking-tight text-gray-700'>Inventários</h1>

      <div className='border rounded-lg p-8 border-dashed flex justify-center items-center text-muted-foreground bg-muted/20 h-64'>
        Gestão de Inventários
      </div>
    </div>
  );
}
