import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import ProBuildLogo from '@/components/ProBuildLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md bg-background rounded-lg border p-8 animate-slide-in">
        <div className="flex justify-center mb-6">
          <div className="bg-primary rounded-lg p-3"><ProBuildLogo /></div>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-status-responded mx-auto" />
            <h1 className="font-display text-2xl font-bold">Check Your Email</h1>
            <p className="text-muted-foreground text-sm">We've sent a password reset link to <strong>{email}</strong></p>
            <Link to="/login"><Button variant="outline" className="mt-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Login</Button></Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-center mb-1">Forgot Password</h1>
            <p className="text-muted-foreground text-sm text-center mb-6">Enter your email to receive a reset link</p>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" />
              </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-display tracking-wide" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                SEND RESET LINK
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              <Link to="/login" className="text-accent hover:underline"><ArrowLeft className="w-3 h-3 inline mr-1" />Back to Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
