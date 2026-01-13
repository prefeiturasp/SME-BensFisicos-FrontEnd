import { Card, CardContent } from '@/components/ui/card';
import { Package, Network, Reply, ListChecks, Home as HomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const dashboardItems = [
  {
    title: 'Bens Patrimoniais',
    icon: Package,
    href: '/bens',
  },
  {
    title: 'Movimentações de Bem Patrimonial',
    icon: Network,
    href: '/movimentacoes',
  },
  {
    title: 'Baixas Físicas de Bens Patrimoniais',
    icon: Reply,
    className: 'rotate-180',
    href: '/baixas',
  },
  {
    title: 'Inventários Cadastrados',
    icon: ListChecks,
    href: '/inventario',
  },
];

export default function HomePage() {
  return (
    <div className='mx-auto'>
      <div className='mb-6 flex items-center gap-2 text-muted-foreground'>
        <HomeIcon className='h-4 w-4' />
        <span className='text-sm'>Início</span>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10'>
        {dashboardItems.map((item) => (
          <Link key={item.title} to={item.href} className='block group'>
            <Card className='h-40 flex flex-col items-center justify-center text-center hover:border-green-500 hover:shadow-md transition-all cursor-pointer'>
              <CardContent className='pt-6 flex flex-col items-center gap-4'>
                <item.icon
                  className={`h-10 w-10 text-green-700 group-hover:text-green-600 transition-colors ${item.className || ''}`}
                />
                <span className='font-medium text-gray-700 group-hover:text-green-700 transition-colors'>
                  {item.title}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
