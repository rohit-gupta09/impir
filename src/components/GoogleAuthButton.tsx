import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type GoogleAuthButtonProps = {
  mode: 'signin' | 'signup';
  disabled?: boolean;
};

export default function GoogleAuthButton({ mode, disabled }: GoogleAuthButtonProps) {
  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      toast.error(error.message);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full h-11 text-sm font-medium"
      onClick={handleGoogleAuth}
      disabled={disabled}
    >
      <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
        <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17 3.3 14.7 2.3 12 2.3 6.7 2.3 2.5 6.5 2.5 11.8S6.7 21.3 12 21.3c6.9 0 9.1-4.8 9.1-7.3 0-.5 0-.8-.1-1.1H12Z" />
        <path fill="#34A853" d="M3.4 7.3l3.2 2.3C7.4 7.7 9.5 6 12 6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17 3.3 14.7 2.3 12 2.3c-3.7 0-6.9 2.1-8.6 5Z" />
        <path fill="#FBBC05" d="M12 21.3c2.6 0 4.8-.9 6.4-2.5l-3-2.4c-.8.6-1.9 1-3.4 1-2.5 0-4.7-1.7-5.4-4l-3.3 2.5c1.7 3.4 5.2 5.4 8.7 5.4Z" />
        <path fill="#4285F4" d="M21.1 13.9c0-.5 0-.8-.1-1.1H12v3.9h5.5c-.3 1.2-1.1 2.1-2.1 2.8l3 2.4c1.7-1.5 2.7-3.8 2.7-6.9Z" />
      </svg>
      {mode === 'signin' ? 'Continue with Google' : 'Sign up with Google'}
    </Button>
  );
}
