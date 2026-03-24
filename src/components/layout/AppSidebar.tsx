import { Settings, X, Menu, ChevronDown, Boxes, ListOrdered } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { useLocation, Link } from 'react-router-dom';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const menuItems = [
  {
    title: 'Bem Patrimonial',
    icon: Boxes,
    isActive: true,
    items: [
      {
        title: 'Bens Patrimoniais',
        url: '/bens-patrimoniais',
      },
      {
        title: 'Movimentações de Bem Patrimonial',
        url: '/movimentacoes',
      },
      {
        title: 'Baixas Físicas de Bens Patrimoniais',
        url: '/baixas-fisicas',
      },
    ],
  },
  {
    title: 'Inventário',
    icon: ListOrdered,
    items: [
      {
        title: 'Cadastro de Inventário',
        url: '/inventarios',
      },
      {
        title: 'Parametrização de Inventário',
        url: '/parametrizacao-inventario',
      },
    ],
  },
  {
    title: 'Configurações',
    icon: Settings,
    items: [
      {
        title: 'Unidades Administrativas',
        url: '/unidades-administrativas',
      },
      {
        title: 'Unidades Orçamentárias',
        url: '/unidades-orcamentarias',
      },
      {
        title: 'Usuários',
        url: '/usuarios',
      },
      {
        title: 'Trocar Senha',
        url: '/trocar-senha',
      },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { state, toggleSidebar, isMobile, setOpenMobile, setOpen } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleSubItemClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
  };

  return (
    <Sidebar collapsible='icon' className='border-r-0'>
      <SidebarHeader
        className={cn(
          isCollapsed ? 'mb-1' : 'mb-3',
          'flex h-[88px] bg-[#267A55] items-center justify-center p-5',
        )}
      >
        {!isCollapsed ? (
          <div className='flex justify-between items-start w-full'>
            <span className='text-white font-bold text-base leading-tight max-w-[160px]'>
              Sistema de Gestão de Bens Patrimoniais
            </span>
            <Button
              variant='ghost'
              size='icon'
              onClick={toggleSidebar}
              className='text-white hover:bg-white/10 -mt-1 -mr-2'
            >
              <X className='size-6' />
            </Button>
          </div>
        ) : (
          <Button
            variant='ghost'
            size='icon'
            onClick={toggleSidebar}
            className='text-white hover:bg-white/10 gap-4'
          >
            <Menu className='size-6' />
          </Button>
        )}
      </SidebarHeader>

      <SidebarContent className='custom-scrollbar px-1 overflow-x-hidden'>
        <SidebarGroup className='p-0'>
          <SidebarGroupContent>
            <SidebarMenu className={cn(isCollapsed ? 'gap-1' : 'gap-2')}>
              {menuItems.map((item) => {
                const isActive = item.items?.some((sub) => location.pathname.startsWith(sub.url));

                if (isCollapsed) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        onClick={toggleSidebar}
                        className='bg-[#267A55] text-white hover:bg-[#1f6849] !h-[90px] !w-full !px-2 !py-2 !flex !flex-col !items-center !justify-center !gap-2 rounded !text-center !overflow-hidden [&>span:last-child]:!truncate-none [&>span:last-child]:!whitespace-normal [&>span:last-child]:!break-words [&>span:last-child]:!overflow-visible'
                      >
                        <item.icon className='!size-7' />
                        <span className='text-sm font-bold leading-tight w-full max-w-full text-center'>
                          {item.title}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={isActive}
                    className='group/collapsible'
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className='bg-[#267A55] text-white hover:bg-[#1f6849] data-[state=open]:bg-white data-[state=open]:text-[#267A55] py-6 px-3 rounded data-[state=open]:rounded-b-none'>
                          <item.icon className='size-border-b !size-6' />
                          <span className='font-bold text-sm flex-1'>{item.title}</span>
                          <ChevronDown className='h-4 w-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180' />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className='bg-white rounded-b'>
                        <SidebarMenuSub className='m-0 p-0 gap-0'>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title} className='p-0'>
                              <SidebarMenuSubButton
                                asChild
                                isActive={location.pathname === subItem.url}
                                className='text-[#595959] font-bold text-sm hover:text-[#267A55] hover:bg-gray-50 data-[active=true]:bg-gray-100 data-[active=true]:text-[#595959] min-h-[50px] py-2 px-3 border-t last:border-x-1 rounded-none !overflow-visible [&>span]:!overflow-visible [&>span]:!truncate-none [&>span]:!whitespace-normal [&>span]:!break-words [&>span]:leading-snug'
                              >
                                <Link to={subItem.url} onClick={handleSubItemClick}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn('p-4 pb-6', isCollapsed && 'hidden')}>
        <img
          src='/prefeitura_logo_branco.png'
          alt='Prefeitura de São Paulo'
          className='w-40 h-auto mx-auto'
        />
      </SidebarFooter>
    </Sidebar>
  );
}
