import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className='flex-1 overflow-auto bg-gray-100 px-6 md:px-10 py-3 md:py-6'>
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
