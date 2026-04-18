import { ShoppingCart, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProBuildLogo from '@/components/ProBuildLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';

export function TopHeader() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-30 h-14 border-b bg-background flex items-center gap-3 px-4">
      {user ? (
        <SidebarTrigger className="lg:hidden" />
      ) : (
        <>
          <SidebarTrigger className="md:hidden" />
          <button type="button" className="shrink-0 [&_span]:!text-foreground" onClick={() => navigate('/')}>
            <ProBuildLogo />
          </button>
        </>
      )}

      {!user && (
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>Home</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>Products</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/quick-quote')}>Quick Quote</Button>
        </div>
      )}

      <div className="flex-1" />

      <div className="ml-auto flex items-center gap-1">
        {user ? (
          <>
            <NotificationsDropdown />

            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/cart')}>
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] px-1 py-0 min-w-[18px] h-[18px]">
                  {itemCount}
                </Badge>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 ml-1">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-foreground">
                      {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">
                    {profile?.full_name || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="w-4 h-4 mr-2" /> View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate('/signup')}>Sign Up</Button>
          </>
        )}
      </div>
    </header>
  );
}
