import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useIsAdmin() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['user-role', user?.id, 'admin'],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase.rpc as any)('has_role', { _user_id: user!.id, _role: 'admin' });
      return !!data;
    },
  });

  return { isAdmin: query.data ?? false, loading: !!user && query.isLoading };
}
