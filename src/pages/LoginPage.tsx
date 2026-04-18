import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ShieldCheck, Truck, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import ProBuildLogo from '@/components/ProBuildLogo';

const trustPoints = [
  { icon: Truck, label: 'Track quotes, deliveries, and repeat buying in one place' },
  { icon: Wallet, label: 'Keep procurement history organized for your team' },
  { icon: ShieldCheck, label: 'Use one secure account across inventory and quotes' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const nextPath = (location.state as { from?: string } | null)?.from || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      navigate(nextPath, { replace: true });
    }
  }, [authLoading, navigate, nextPath, user]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    toast.success('Welcome back');
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f1e8_0%,#f4efe8_35%,#ffffff_100%)] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[28px] border border-black/5 bg-background shadow-[0_20px_80px_rgba(37,31,24,0.08)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#1f3a2e] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(238,190,120,0.28),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.10),transparent_32%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm backdrop-blur">
              <div className="rounded-md px-2 py-1 text-[#1f3a2e]">
                <ProBuildLogo />
              </div>
              Romart Procurement Workspace
            </div>
            <div className="mt-14 max-w-xl space-y-5">
              <p className="text-sm uppercase tracking-[0.24em] text-white/70">Sign In</p>
              <h1 className="font-display text-5xl font-bold leading-tight">
                Procurement access built for daily buying teams.
              </h1>
              <p className="max-w-lg text-base leading-7 text-white/78">
                Manage inventory, raise quick quotes, and keep every purchase request visible without juggling spreadsheets and chats.
              </p>
            </div>
          </div>

          <div className="relative grid gap-3">
            {trustPoints.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-start gap-3 rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur">
                <div className="mt-0.5 rounded-xl bg-white/12 p-2">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm leading-6 text-white/84">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 space-y-4">
              <div className="inline-flex items-center gap-3 rounded-full border bg-muted/40 px-4 py-2 text-sm text-muted-foreground lg:hidden">
                <div className="rounded-md bg-primary px-2 py-1">
                  <ProBuildLogo />
                </div>
                Romart
              </div>
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-bold text-foreground">Welcome back</h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  Sign in with your work email to continue to inventory, quotes, and procurement tracking.
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="you@company.com"
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-sm font-medium text-accent hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    placeholder="Enter your password"
                    className="h-12 rounded-xl pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                  Keep me signed in on this device
                </Label>
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-accent font-display text-base tracking-wide text-accent-foreground hover:bg-accent/90"
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign In
              </Button>
            </form>

            <div className="mt-6 rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
              New to Romart?{' '}
              <Link to="/signup" state={location.state} className="font-medium text-accent hover:underline">
                Create an account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
