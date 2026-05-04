import { Boxes, Network, ListEnd, ListOrdered } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ShortcutCard } from '@/components/ShortcutCard';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

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
    href: '/bens-patrimoniais',
  },
  {
    title: 'Movimentações de Bem Patrimonial',
    icon: Network,
    href: '/movimentacoes',
  },
  {
    title: 'Baixas Físicas de Bens Patrimoniais',
    icon: ListEnd,
    href: '/baixas-fisicas',
  },
  {
    title: 'Inventários Cadastrados',
    icon: ListOrdered,
    href: '/inventarios',
  },
  {
    title: 'Parâmetros de Conciliação Anual',
    icon: ListOrdered,
    href: '/parametros-conciliacao-anual',
  },
];

export default function HomePage() {
  return (
    <div className='mx-auto'>
      <AppBreadcrumb />

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
