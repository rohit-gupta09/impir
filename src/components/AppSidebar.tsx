import { Home, Package, ShoppingCart, FileText, Heart, User, Phone, LogOut, Shield, ShoppingBag, Boxes, PenSquare } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useIsHubManager } from '@/hooks/useIsHubManager';
import ProBuildLogo from '@/components/ProBuildLogo';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { title: 'Home', url: '/dashboard', icon: Home },
  { title: 'Products', url: '/products', icon: Package },
  { title: 'My Cart', url: '/cart', icon: ShoppingCart, hasBadge: true },
  { title: 'My Quotes', url: '/quotes', icon: FileText },
  { title: 'Quick Quote', url: '/quick-quote', icon: PenSquare },
  { title: 'My Orders', url: '/orders', icon: ShoppingBag },
  { title: 'My Inventory', url: '/inventory', icon: Boxes },
  { title: 'Wishlist', url: '/wishlist', icon: Heart },
  { title: 'My Profile', url: '/profile', icon: User },
  { title: 'Contact Us', url: '/contact', icon: Phone },
];

const publicNavItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Products', url: '/products', icon: Package },
  { title: 'Quick Quote', url: '/quick-quote', icon: PenSquare },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();
  const { isAdmin } = useIsAdmin();
  const { isHubManager } = useIsHubManager();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!user) {
    if (!isMobile) {
      return null;
    }

    return (
      <Sidebar collapsible="offcanvas" className="border-r-0">
        <div className="p-4 border-b border-sidebar-border">
          <ProBuildLogo />
        </div>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {publicNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/'}
                        className="flex items-center gap-3 px-3 py-2 rounded text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors duration-150"
                        activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-3 space-y-2">
          <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/login')}>
            Login
          </Button>
          <Button className="w-full justify-start bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate('/signup')}>
            Sign Up
          </Button>
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="p-4 border-b border-sidebar-border">
        <ProBuildLogo collapsed={collapsed} />
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className="flex items-center gap-3 px-3 py-2 rounded text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors duration-150"
                      activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!collapsed && (
                        <span className="flex-1 flex items-center justify-between">
                          {item.title}
                          {item.hasBadge && itemCount > 0 && (
                            <Badge className="bg-accent text-accent-foreground text-xs px-1.5 py-0 min-w-[20px] text-center">
                              {itemCount}
                            </Badge>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3 space-y-1">
        {isAdmin && (
          <SidebarMenuButton asChild>
            <NavLink
              to="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors duration-150"
              activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
            >
              <Shield className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Admin Panel</span>}
            </NavLink>
          </SidebarMenuButton>
        )}
        {isHubManager && (
          <SidebarMenuButton asChild>
            <NavLink
              to="/hub"
              className="flex items-center gap-3 px-3 py-2 rounded text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors duration-150"
              activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
            >
              <Package className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Hub Panel</span>}
            </NavLink>
          </SidebarMenuButton>
        )}
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
