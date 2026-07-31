import {
  Settings,
  X,
  Menu,
  ChevronDown,
  Boxes,
  ListOrdered,
  Building2, Users,
  Landmark,
} from 'lucide-react'
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
} from '@/components/ui/sidebar'
import { useAuth } from '@/auth/useAuth'
import { useLocation, Link } from 'react-router-dom'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { canAccessParametrosConciliacao } from '@/modules/inventario/parametros-conciliacao-anual/utils/permissions'

const menuItems = [
  {
    type: 'group' as const,
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
        title: 'Transferência de Bens Patrimoniais',
        url: '/transferencias',
      },
      {
        title: 'Baixas Físicas de Bens Patrimoniais',
        url: '/baixas-fisicas',
      },
    ],
  },
  {
    type: 'group' as const,
    title: 'Inventário',
    icon: ListOrdered,
    items: [
      {
        title: 'Gerenciamento de Conciliações',
        url: '/conciliacoes',
      },
      {
        title: 'Parâmetros de Conciliação Anual',
        url: '/parametros-conciliacao-anual',
      },
    ],
  },
  {
    type: 'link' as const,
    title: 'Unidades Orçamentárias',
    icon: Landmark,
    url: '/unidades-orcamentarias',
    requiresSuperuser: true,
  },
  {
    type: 'link' as const,
    title: 'Unidades Administrativas',
    icon: Building2,
    url: '/unidades-administrativas',
  },
  {
    type: 'link' as const,
    title: 'Usuários',
    icon: Users,
    url: '/usuarios',
  },
  {
    type: 'group' as const,
    title: 'Configurações',
    icon: Settings,
    items: [
      {
        title: 'Trocar Senha',
        url: '/trocar-senha',
      },
    ],
  },
]

export function AppSidebar() {
  const location = useLocation()
  const { user } = useAuth()
  const { state, toggleSidebar, isMobile, setOpenMobile, setOpen } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const canAccessParametros = canAccessParametrosConciliacao(user)
  const visibleMenuItems = menuItems
    .filter((item) => item.type !== 'link' || !item.requiresSuperuser || Boolean(user?.is_superuser))
    .map((item) => {
      if (item.type === 'link') {
        return item
      }

      if (item.items.some((subItem) => subItem.url === '/conciliacoes')) {
        return {
          ...item,
          items: item.items.filter(
            (subItem) => subItem.url !== '/parametros-conciliacao-anual' || canAccessParametros,
          ),
        }
      }

      return item
    })

  const handleSubItemClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    } else {
      setOpen(false)
    }
  }

  return (
    <Sidebar collapsible='icon' className='border-r-0'>
      <SidebarHeader
        className={cn(
          isCollapsed ? 'mb-1' : 'mb-3',
          'flex h-[88px] bg-[#267A55] items-center justify-center p-5',
        )}
      >
        {isCollapsed ? (
          <Button
            variant='ghost'
            size='icon'
            onClick={toggleSidebar}
            className='text-white hover:bg-white/10 gap-4'
          >
            <Menu className='size-6' />
          </Button>
        ) : (
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
        )}
      </SidebarHeader>

      <SidebarContent className='custom-scrollbar px-1 overflow-x-hidden'>
        <SidebarGroup className='p-0'>
          <SidebarGroupContent>
            <SidebarMenu className={cn(isCollapsed ? 'gap-1' : 'gap-2')}>
              {visibleMenuItems.map((item) => {
                if (item.type === 'link') {
                  const isItemActive = location.pathname.startsWith(item.url)

                  if (isCollapsed) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          tooltip={item.title}
                          className='bg-[#267A55] text-white hover:bg-[#1f6849] !h-[90px] !w-full !px-2 !py-2 !flex !flex-col !items-center !justify-center !gap-2 rounded !text-center !overflow-hidden [&>span:last-child]:!truncate-none [&>span:last-child]:!whitespace-normal [&>span:last-child]:!break-words [&>span:last-child]:!overflow-visible'
                        >
                          <Link to={item.url} onClick={handleSubItemClick}>
                            <item.icon className='!size-7' />
                            <span className='text-sm font-bold leading-tight w-full max-w-full text-center'>
                              {item.title}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isItemActive}
                        className='bg-[#267A55] text-white hover:bg-[#1f6849] data-[active=true]:bg-white data-[active=true]:text-[#267A55] py-6 px-3 rounded'
                      >
                        <Link to={item.url} onClick={handleSubItemClick}>
                          <item.icon className='size-border-b !size-6' />
                          <span className='font-bold text-sm flex-1'>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }

                const isActive = item.items?.some((sub) => location.pathname.startsWith(sub.url))

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
                  )
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
                                className='text-[#595959] font-bold text-sm hover:text-[#267A55] hover:bg-gray-50 data-[active=true]:bg-gray-100 data-[active=true]:text-[#595959] min-h-[50px] py-2 px-3 border-t last:border-x-1 rounded-none !overflow-visible [&>span]:!overflow-visible [&>span]:!truncate-none [&>span]:!whitespace-normal [&>span]:!break-words [&>span]:!leading-snug'
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
                )
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
  )
}
