import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ShortcutCardProps {
  title: string;
  icon: LucideIcon;
  href: string;
  className?: string;
  iconClassName?: string;
}

export function ShortcutCard({
  title,
  icon: Icon,
  href,
  className,
  iconClassName,
}: ShortcutCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        'block group h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2',
        className,
      )}
      aria-label={`Navegar para ${title}`}
    >
      <Card className='relative h-44 flex flex-col items-center justify-center text-center overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-border bg-white rounded-sm'>
        <CardContent className='pt-6 flex flex-col items-center gap-4 pb-8 w-full z-10 px-4'>
          {/* Ícone */}
          <Icon
            className={cn(
              'h-12 w-12 text-green-700 transition-transform duration-300 group-hover:scale-110 group-hover:text-green-600',
              iconClassName,
            )}
          />
          {/* Título */}
          <span className='font-normal text-gray-600 text-sm md:text-base leading-tight group-hover:text-green-700 transition-colors line-clamp-2'>
            {title}
          </span>
        </CardContent>
        {/* Barra Inferior Verde */}
        <div className='absolute bottom-0 left-0 w-full h-1.5 bg-green-700' />
      </Card>
    </Link>
  );
}
