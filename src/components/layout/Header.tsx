import * as React from 'react';
import { CheckCircle2, ChevronDown, Power } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useEscopoSelector } from './useEscopoSelector';

export function Header() {
  const { user, logout } = useAuth();
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const {
    grupos,
    filter,
    setFilter,
    selectedValue,
    selectedLabel,
    filteredGroups,
    isGroupExpanded,
    updateGroupExpanded,
    selectEscopoByValue,
    selecionarEscopoMutation,
  } = useEscopoSelector({ user });

  const closeDropdown = React.useCallback(() => {
    setIsOpen(false);
    setFilter('');
  }, [setFilter]);

  const handleSelectChange = (value: string) => {
    const selected = selectEscopoByValue(value);
    if (selected) {
      closeDropdown();
    }
  };

  React.useEffect(() => {
    if (!isOpen) {
      setFilter('');
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setFilter]);

  return (
    <header className='sticky top-0 z-50 flex h-16 md:h-24 shrink-0 items-center justify-between border-b bg-white px-4 md:px-8 shadow-md'>
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
        <div
          ref={dropdownRef}
          className='relative flex items-center gap-2 w-full max-w-72 md:max-w-2xl bg-white p-1 rounded-md border border-gray-300 shadow-sm'
        >
          <span className='hidden md:inline text-sm font-bold text-green-800 pl-3 whitespace-nowrap'>
            Unidade:
          </span>
          <div className='relative w-full'>
            <button
              type='button'
              data-testid='escopo-toggle'
              className='flex h-8 md:h-9 w-full items-center justify-between gap-2 rounded-md border border-transparent bg-transparent px-2 text-left text-xs md:text-sm text-gray-700 font-normal outline-none focus-visible:ring-2 focus-visible:ring-green-600/30 disabled:cursor-not-allowed disabled:opacity-60'
              onClick={() => setIsOpen((prev) => !prev)}
              disabled={grupos.length === 0 || selecionarEscopoMutation.isPending}
              aria-expanded={isOpen}
              aria-haspopup='listbox'
            >
              <span className='truncate'>{selectedLabel}</span>
              <ChevronDown className='size-4 text-gray-500' />
            </button>
          </div>

          {isOpen && (
            <div
              data-testid='escopo-dropdown'
              className='absolute left-0 right-0 top-full z-80 mt-2 w-full min-w-full rounded-md border border-gray-200 bg-white shadow-2xl'
            >
              <div className='p-2 border-b border-gray-100'>
                <Input
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder='Buscar unidade...'
                  className='h-8 text-xs md:text-sm'
                />
              </div>
              <div className='max-h-80 overflow-y-auto p-1 [scrollbar-gutter:stable]'>
                {filteredGroups.length === 0 ? (
                  <div className='px-3 py-2 text-xs text-gray-500'>Nenhuma unidade encontrada.</div>
                ) : (
                  filteredGroups.map((grupo) => {
                    const isSelectedUo = selectedValue === `uo:${grupo.uo.id}`;
                    const isGroupOpen = isGroupExpanded(grupo.uo.id);

                    return (
                      <Collapsible
                        key={grupo.uo.id}
                        open={isGroupOpen}
                        onOpenChange={(open) => updateGroupExpanded(grupo.uo.id, open)}
                      >
                        <div className='flex items-center justify-between gap-2 px-2 py-1.5'>
                          <button
                            type='button'
                            onClick={() => handleSelectChange(`uo:${grupo.uo.id}`)}
                            disabled={!grupo.uo.selecionavel}
                            aria-current={isSelectedUo ? 'true' : undefined}
                            className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-xs md:text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 ${
                              isSelectedUo ? 'bg-green-50 text-green-700' : ''
                            }`}
                          >
                            <span className='min-w-0 flex-1 truncate'>{grupo.uo.label}</span>
                            {isSelectedUo && (
                              <CheckCircle2 className='ml-auto size-4 shrink-0 text-green-700' />
                            )}
                          </button>
                          <CollapsibleTrigger asChild>
                            <button
                              type='button'
                              className='flex h-9 w-9 items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100'
                            >
                              <ChevronDown className='size-4' />
                            </button>
                          </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent>
                          <div className='pb-2'>
                            {grupo.uas.map((ua) => {
                              const isSelectedUa =
                                selectedValue === `ua:${ua.unidade_administrativa_id}`;

                              return (
                                <button
                                  key={ua.id}
                                  type='button'
                                  onClick={() =>
                                    handleSelectChange(`ua:${ua.unidade_administrativa_id}`)
                                  }
                                  aria-current={isSelectedUa ? 'true' : undefined}
                                  className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs md:text-sm text-gray-600 hover:bg-gray-50 ${
                                    isSelectedUa ? 'bg-green-50 text-green-700' : ''
                                  }`}
                                >
                                  <span className='flex-1'>{ua.label}</span>
                                  {isSelectedUa && (
                                    <CheckCircle2 className='size-4 text-green-700' />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Direita: Info do Usuário + Sair */}
      <div className='flex items-center gap-2 md:gap-4'>
        <div className='hidden md:flex flex-col items-end justify-center border border-gray-200 px-2 py-1.5 rounded bg-gray-100 min-w-52'>
          <div className='flex items-center justify-start gap-2 w-full text-[11px] leading-snug'>
            <span className='font-bold text-gray-600'>RF:</span>
            <span className='text-gray-600'>{user?.rf ?? '00000000'}</span>
          </div>

          <div className='flex items-center justify-start gap-2 w-full text-[11px] leading-snug'>
            <span className='font-bold text-gray-600'>NOME:</span>
            <span className='truncate max-w-52 uppercase font-normal text-gray-600'>
              {user?.nome?.toUpperCase() ?? 'USUÁRIO DO SISTEMA'}
            </span>
          </div>

          <div className='flex items-center justify-start gap-2 w-full text-[11px] leading-snug'>
            <span className='font-bold text-gray-600'>CARGO/FUNÇÃO:</span>
            <span className='truncate max-w-52 uppercase font-normal text-gray-600'>
              {user?.is_superuser
                ? 'SUPER-ADMIN'
                : user?.is_gestor_patrimonio
                  ? 'GESTOR'
                  : 'OPERADOR'}
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
