import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, Eye, EyeOff, Loader2, UserRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeGSTIN } from '@/lib/businessAccounts';
import { queueSignupWhatsapp } from '@/lib/whatsappNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import ProBuildLogo from '@/components/ProBuildLogo';

const benefits = [
  'Create quick quotes in minutes',
  'Track inventory and reorder needs',
  'Manage buying details under one account',
];

export default function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const nextPath = (location.state as { from?: string } | null)?.from || '/dashboard';
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    designation: '',
    gstin: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizePhone = (value: string) => value.replace(/\D/g, '');

  // useEffect(() => {
  //   if (!authLoading && user) {
  //     navigate(nextPath, { replace: true });
  //   }
  // }, [authLoading, navigate, nextPath, user]);

  useEffect(() => {
  if (!authLoading && user && location.pathname !== "/auth/callback") {
    navigate(nextPath, { replace: true });
  }
}, [authLoading, navigate, nextPath, user, location.pathname]);

  const update = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const passwordStrength = () => {
    const password = form.password;
    if (password.length < 6) return { label: 'Too short', color: 'bg-destructive', width: 'w-1/4' };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: 'Weak', color: 'bg-status-pending', width: 'w-1/3' };
    if (score <= 2) return { label: 'Fair', color: 'bg-status-review', width: 'w-2/3' };
    return { label: 'Strong', color: 'bg-status-responded', width: 'w-full' };
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreed) {
      setError('Please accept the Terms & Conditions');
      return;
    }

    setLoading(true);

    const normalizedEmail = form.email.trim().toLowerCase();
    const normalizedPhone = normalizePhone(form.phone);

    const { data: conflictData, error: conflictError } = await supabase.rpc(
      'check_signup_conflicts' as never,
      {
        _email: normalizedEmail,
        _phone: normalizedPhone,
      } as never,
    );

    if (!conflictError && conflictData && typeof conflictData === 'object') {
      const emailExists = Boolean((conflictData as { email_exists?: boolean }).email_exists);
      const phoneExists = Boolean((conflictData as { phone_exists?: boolean }).phone_exists);

      if (emailExists || phoneExists) {
        setLoading(false);
        if (emailExists && phoneExists) {
          setError('Account already exists with this email and phone number');
          return;
        }
        if (emailExists) {
          setError('Account already exists with this email');
          return;
        }
        setError('Account already exists with this phone number');
        return;
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          phone: form.phone,
          company_name: form.company,
          designation: form.designation,
          gstin: normalizeGSTIN(form.gstin),
        },
        // emailRedirectTo: window.location.origin,
                emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('already') || message.includes('registered') || message.includes('exists')) {
        setError('Account already exists with this email');
        return;
      }
      setError(error.message);
      return;
    }

    if (data.session) {
      queueSignupWhatsapp({
        fullName: form.fullName,
        phone: form.phone,
        companyName: form.company,
        accountType: 'User/Supplier',
      });
      toast.success('Account created');
      return;
    }

    queueSignupWhatsapp({
      fullName: form.fullName,
      phone: form.phone,
      companyName: form.company,
      accountType: 'User/Supplier',
    });
    toast.success('Account created. Check your email to confirm your account.');
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5efe6_0%,#ffffff_100%)] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[28px] border border-black/5 bg-background shadow-[0_20px_80px_rgba(37,31,24,0.08)] lg:grid-cols-[0.96fr_1.04fr]">
        <section className="relative hidden overflow-hidden bg-[#8a4b21] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,214,153,0.22),transparent_34%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm backdrop-blur">
              <div className="rounded-md px-2 py-1 text-[#8a4b21]">
                <ProBuildLogo />
              </div>
              Create Your Buyer Account
            </div>
            <div className="mt-14 max-w-xl space-y-5">
              <p className="text-sm uppercase tracking-[0.24em] text-white/70">Sign Up</p>
              <h1 className="font-display text-5xl font-bold leading-tight">
                Build a cleaner workflow for daily procurement.
              </h1>
              <p className="max-w-lg text-base leading-7 text-white/80">
                Start with email signup and keep your quotes, inventory, and business details in one place from day one.
              </p>
            </div>
          </div>

          <div className="relative grid gap-3">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#ffd29a]" />
                <p className="text-sm text-white/88">{benefit}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-xl">
            <div className="mb-8 space-y-4">
              <div className="inline-flex items-center gap-3 rounded-full border bg-muted/40 px-4 py-2 text-sm text-muted-foreground lg:hidden">
                <div className="rounded-md bg-primary px-2 py-1">
                  <ProBuildLogo />
                </div>
                Romart
              </div>
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-bold text-foreground">Create your account</h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  Set up your buyer profile with email and start managing quotes and inventory from one workspace.
                </p>
              </div>
            </div>

            <form onSubmit={handleSignUp} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="full-name" value={form.fullName} onChange={update('fullName')} required placeholder="John Doe" className="h-12 rounded-xl pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={form.phone} onChange={update('phone')} required placeholder="+91 98765 43210" className="h-12 rounded-xl" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={update('email')} required placeholder="you@company.com" className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company / Business Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="company" value={form.company} onChange={update('company')} placeholder="Optional" className="h-12 rounded-xl pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input id="designation" value={form.designation} onChange={update('designation')} placeholder="Procurement Manager" className="h-12 rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  value={form.gstin}
                  onChange={(event) => setForm((current) => ({ ...current, gstin: normalizeGSTIN(event.target.value) }))}
                  placeholder="27ABCDE1234F1Z5"
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={update('password')}
                      required
                      placeholder="Min 6 characters"
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
                  {form.password && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                      </div>
                      <span className="text-xs text-muted-foreground">{strength.label}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={update('confirmPassword')}
                      required
                      placeholder="Re-enter password"
                      className="h-12 rounded-xl pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} />
                <Label htmlFor="terms" className="text-sm font-normal leading-6 text-muted-foreground">
                  I agree to the <span className="font-medium text-foreground">Terms & Conditions</span> and <span className="font-medium text-foreground">Privacy Policy</span>.
                </Label>
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-accent font-display text-base tracking-wide text-accent-foreground hover:bg-accent/90"
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Account
              </Button>
            </form>

            <div className="mt-6 rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" state={location.state} className="font-medium text-accent hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
