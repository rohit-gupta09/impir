import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ProBuildLogo from '@/components/ProBuildLogo';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('type=recovery')) {
      navigate('/login');
    }
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated successfully!');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md bg-background rounded-lg border p-8 animate-slide-in">
        <div className="flex justify-center mb-6">
          <div className="bg-primary rounded-lg p-3"><ProBuildLogo /></div>
        </div>
        <h1 className="font-display text-2xl font-bold text-center mb-1">Set New Password</h1>
        <p className="text-muted-foreground text-sm text-center mb-6">Enter your new password below</p>
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min 6 characters" />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Re-enter password" />
          </div>
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-display tracking-wide" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            UPDATE PASSWORD
          </Button>
        </form>
      </div>
    </div>
  );
}
