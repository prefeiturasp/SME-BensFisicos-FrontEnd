import { Boxes } from 'lucide-react';
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
        <Button
          className='bg-white hover:bg-green-800 text-sm text-green-800 hover:text-white border-green-800 border rounded-sm p-5'
          asChild
        >
          <Link to='/bens-patrimoniais/novo'>Novo Cadastro</Link>
        </Button>
      </div>

      <div className='border rounded-lg p-8 border-dashed flex justify-center items-center text-muted-foreground bg-muted/20 h-64'>
        Lista de Bens Patrimoniais (DataTable)
      </div>
    </div>
  );
}
