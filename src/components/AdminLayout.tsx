import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Badge } from '@/components/ui/badge';
import { AdminNotificationsDropdown } from '@/components/AdminNotificationsDropdown';
import { RouteScrollContainer } from '@/components/RouteScrollContainer';

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b px-4 gap-3 bg-background sticky top-0 z-10">
            <SidebarTrigger />
            <Badge className="bg-accent text-accent-foreground font-display text-xs">ADMIN</Badge>
            <span className="font-display text-sm text-muted-foreground flex-1">Romart Admin Panel</span>
            <AdminNotificationsDropdown />
          </header>
          <RouteScrollContainer className="flex-1 overflow-auto p-4 md:p-6" />
        </div>
      </div>
    </SidebarProvider>
  );
}
