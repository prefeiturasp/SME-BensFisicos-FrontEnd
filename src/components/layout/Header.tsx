import { Power } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className='sticky top-0 z-10 flex h-16 md:h-24 shrink-0 items-center justify-between border-b bg-white px-4 md:px-8 shadow-md'>
      {/* Esquerda: Menu + Logo */}
      <div className='flex items-center gap-2 md:gap-4'>
        <SidebarTrigger className='md:hidden -ml-2 h-9 w-9 text-green-700 hover:bg-green-50 hover:text-green-800' />

        {/* Logo */}
        <Link to='/home' className='flex items-center'>
          <img
            src='/bens_logo_padrao.png'
            alt='Logo Bens Físicos'
            className='h-12 md:h-16 w-auto object-contain'
          />
        </Link>
      </div>

      {/* Centro: Seletor de Unidade */}
      <div className='flex-1 flex justify-center px-2 md:px-4'>
        <div className='flex items-center gap-2 w-full max-w-52 md:max-w-md bg-white p-1 rounded-md border border-gray-300 shadow-sm'>
          <span className='hidden md:inline text-sm font-bold text-green-800 pl-3 whitespace-nowrap'>
            Unidade:
          </span>
          <Select defaultValue='sme'>
            <SelectTrigger className='h-8 md:h-9 border-0 bg-transparent shadow-none focus:ring-0 w-full text-xs md:text-sm text-gray-700 font-normal'>
              <SelectValue placeholder='Selecione a unidade' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='sme'>SECRETARIA MUNICIPAL DE EDUCAÇÃO</SelectItem>
              {user?.unidade_administrativa && (
                <SelectItem value={user.unidade_administrativa.id.toString()}>
                  {user.unidade_administrativa.nome}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Direita: Info do Usuário + Sair */}
      <div className='flex items-center gap-2 md:gap-4'>
        <div className='hidden md:flex flex-col items-end justify-center border border-gray-200 px-2 py-1.5 rounded bg-gray-100 min-w-52'>
          <div className='flex items-center justify-start gap-2 w-full text-[11px] leading-snug'>
            <span className='font-bold text-gray-600'>RF:</span>
            <span className='text-gray-600'>{user?.rf || '00000000'}</span>
          </div>

          <div className='flex items-center justify-start gap-2 w-full text-[11px] leading-snug'>
            <span className='font-bold text-gray-600'>NOME:</span>
            <span className='truncate max-w-52 uppercase font-normal text-gray-600'>
              {user?.nome.toUpperCase() || 'USUÁRIO DO SISTEMA'}
            </span>
          </div>

          <div className='flex items-center justify-start gap-2 w-full text-[11px] leading-snug'>
            <span className='font-bold text-gray-600'>CARGO/FUNÇÃO:</span>
            <span className='truncate max-w-52 uppercase font-normal text-gray-600'>
              {user?.is_gestor_patrimonio ? 'GESTOR' : 'OPERADOR'}
            </span>
          </div>
        </div>

        <button
          type='button'
          className='flex flex-col items-center justify-center gap-1 group cursor-pointer ml-2 bg-transparent border-none p-0'
          onClick={logout}
        >
          <Button
            asChild
            variant='ghost'
            size='icon'
            className='text-white hover:bg-green-600 hover:text-white h-8 w-8 border rounded-full shadow-sm cursor-pointer bg-green-700'
          >
            <div>
              <Power className='size-4 md:size-5' />
            </div>
          </Button>
          <span className='text-xs text-gray-500'>Sair</span>
        </button>
      </div>
    </header>
  );
}
