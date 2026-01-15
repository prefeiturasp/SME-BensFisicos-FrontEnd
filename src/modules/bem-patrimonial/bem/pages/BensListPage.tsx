import { Boxes, PlusCircle } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function BensListPage() {
  return (
    <div className='space-y-4'>
      <AppBreadcrumb
        items={[
          { label: 'Bem Patrimonial', icon: Boxes },
          { label: 'Bens Patrimoniais', isActive: true },
        ]}
      />

      <div className='flex justify-between items-center'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>Bens Patrimoniais</h1>
        <Button asChild>
          <Link to='/bens-patrimoniais/novo'>
            <PlusCircle className='mr-2 h-4 w-4' />
            Adicionar Bem
          </Link>
        </Button>
      </div>

      <div className='border rounded-lg p-8 border-dashed flex justify-center items-center text-muted-foreground bg-muted/20 h-64'>
        Lista de Bens Patrimoniais (DataTable)
      </div>
    </div>
  );
}
