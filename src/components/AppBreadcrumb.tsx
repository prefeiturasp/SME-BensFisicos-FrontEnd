import { Fragment } from 'react';
import { Home, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';

export interface BreadcrumbItemProps {
  label: string;
  icon?: LucideIcon;
  to?: string;
  isActive?: boolean;
}

interface AppBreadcrumbProps {
  items?: BreadcrumbItemProps[];
}
export function AppBreadcrumb({ items = [] }: Readonly<AppBreadcrumbProps>) {
  const allItems: BreadcrumbItemProps[] = [{ label: 'Início', icon: Home, to: '/home' }, ...items];

  return (
    <Breadcrumb className='mb-7'>
      <BreadcrumbList>
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isActive = item.isActive ?? isLast;
          const Icon = item.icon;

          return (
            <Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem>
                {isActive ? (
                  <BreadcrumbPage
                    className={cn('flex items-center gap-2', 'font-normal text-green-800 text-sm')}
                  >
                    {Icon && <Icon className='h-4 w-4' />}
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      to={item.to ?? '#'}
                      className='flex items-center gap-2 transition-colors hover:text-foreground'
                    >
                      {Icon && <Icon className='h-4 w-4' />}
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
