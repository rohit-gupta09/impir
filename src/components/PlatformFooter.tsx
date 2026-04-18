import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import ProBuildLogo from '@/components/ProBuildLogo';
import { useAuth } from '@/contexts/AuthContext';

const quickLinks = [
  { label: 'Home', to: '/dashboard' },
  { label: 'Products', to: '/products' },
  { label: 'Quotes', to: '/quotes' },
  { label: 'Orders', to: '/orders' },
];

const supportLinks = [
  { label: 'Contact', to: '/contact' },
  { label: 'Profile', to: '/profile' },
  { label: 'Inventory', to: '/inventory' },
  { label: 'Partner', to: '/partner' },
];

export function PlatformFooter() {
  const year = new Date().getFullYear();
  const { user } = useAuth();
  const homeLink = user ? '/dashboard' : '/';

  return (
    <footer className="border-t bg-gradient-to-br from-muted/40 via-background to-accent/5">
      <div className="mx-auto grid gap-8 px-4 py-8 md:px-6 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
        <div className="space-y-4">
          {user ? (
            <div className="[&_span]:!text-foreground">
              <ProBuildLogo />
            </div>
          ) : (
            <Link to="/products" className="font-display text-lg font-bold tracking-wide text-foreground">
              Catalog
            </Link>
          )}
          <p className="max-w-sm text-sm text-muted-foreground">
            Built for builders, contractors, and industrial buyers who need a cleaner way to source hardware, manage quotes, and place repeat orders.
          </p>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Explore</h3>
          <div className="mt-4 space-y-3 text-sm">
            {quickLinks.map((link) => (
              <Link key={link.to} to={link.label === 'Home' ? homeLink : link.to} className="block text-foreground/80 transition-colors hover:text-accent">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Account</h3>
          <div className="mt-4 space-y-3 text-sm">
            {supportLinks.map((link) => (
              <Link key={link.to} to={link.to} className="block text-foreground/80 transition-colors hover:text-accent">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Support</h3>
          <div className="mt-4 space-y-3 text-sm text-foreground/80">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-accent" />
              <span>+91 8306357208</span>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-accent" />
              <span>supportromart@gmail.com</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-accent" />
              <span>Tej mandi, Alwar</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t px-4 py-4 md:px-6">
        <div className="flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {year} {user ? 'Romart' : 'Catalog'}. All rights reserved.</p>
          <p>Procurement platform for quotes, inventory, and repeat buying.</p>
        </div>
      </div>
    </footer>
  );
}
