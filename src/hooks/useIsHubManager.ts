import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useIsHubManager() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['user-role', user?.id, 'hub_manager'],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase.rpc as any)('has_role', { _user_id: user!.id, _role: 'hub_manager' });
      return !!data;
    },
  });

  return { isHubManager: query.data ?? false, loading: !!user && query.isLoading };
}
