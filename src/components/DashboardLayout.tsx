import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { TopHeader } from '@/components/TopHeader';
import { PlatformFooter } from '@/components/PlatformFooter';
import { RouteScrollContainer } from '@/components/RouteScrollContainer';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardLayout() {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className={`flex min-w-0 flex-1 flex-col ${user ? '' : 'w-full'}`}>
          <TopHeader />
          <RouteScrollContainer className="flex-1 overflow-auto p-4 md:p-6" />
          <PlatformFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}
