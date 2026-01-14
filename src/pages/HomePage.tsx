import type { LucideIcon } from 'lucide-react';
import { Boxes, Network, ListEnd, ListOrdered, Home as HomeIcon } from 'lucide-react';
import { ShortcutCard } from '@/components/ShortcutCard';

interface DashboardItem {
  title: string;
  icon: LucideIcon;
  href: string;
  iconClassName?: string;
}

const dashboardItems: DashboardItem[] = [
  {
    title: 'Bens Patrimoniais',
    icon: Boxes,
    href: '/bens',
  },
  {
    title: 'Movimentações de Bem Patrimonial',
    icon: Network,
    href: '/movimentacoes',
  },
  {
    title: 'Baixas Físicas de Bens Patrimoniais',
    icon: ListEnd,
    href: '/baixas',
  },
  {
    title: 'Inventários Cadastrados',
    icon: ListOrdered,
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
          <ShortcutCard
            key={item.title}
            title={item.title}
            icon={item.icon}
            href={item.href}
            iconClassName={item.iconClassName}
          />
        ))}
      </div>
    </div>
  );
}
