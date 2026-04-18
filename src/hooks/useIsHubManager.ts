import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useIsHubManager() {
  const { user } = useAuth();
  const [isHubManager, setIsHubManager] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsHubManager(false);
      setLoading(false);
      return;
    }

    (supabase.rpc as any)('has_role', { _user_id: user.id, _role: 'hub_manager' }).then(
      ({ data }: { data: boolean }) => {
        setIsHubManager(!!data);
        setLoading(false);
      },
    );
  }, [user]);

  return { isHubManager, loading };
}
