import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsAdmin(false); setLoading(false); return; }
    (supabase.rpc as any)('has_role', { _user_id: user.id, _role: 'admin' })
      .then(({ data }: { data: boolean }) => { setIsAdmin(!!data); setLoading(false); });
  }, [user]);

  return { isAdmin, loading };
}
