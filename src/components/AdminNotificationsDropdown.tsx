import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface AdminNotification {
  id: string;
  message: string;
  type: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export function AdminNotificationsDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    const items = (data || []) as AdminNotification[];
    setNotifications(items);
    setUnreadCount(items.filter(n => !n.is_read).length);
  };

  useEffect(() => {
    fetchNotifications();
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAsRead = async (n: AdminNotification) => {
    if (!n.is_read) {
      await supabase.from('admin_notifications').update({ is_read: true }).eq('id', n.id);
    }
    if (n.type === 'quote' || n.type === 'quote_accepted') navigate('/admin/quotes');
    else if (n.type === 'order' || n.type === 'payment_bypass_order') navigate('/admin/orders');
    fetchNotifications();
  };

  const markAllRead = async () => {
    await supabase.from('admin_notifications').update({ is_read: true }).eq('is_read', false);
    fetchNotifications();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] px-1 py-0 min-w-[18px] h-[18px]">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="font-display font-bold text-sm">Admin Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
              <CheckCheck className="w-3 h-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-72">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No notifications</div>
          ) : (
            notifications.map(n => (
              <DropdownMenuItem
                key={n.id}
                className={`flex items-start gap-2 p-3 cursor-pointer ${!n.is_read ? 'bg-destructive/5' : ''}`}
                onClick={() => markAsRead(n)}
              >
                <div className="flex-1 space-y-1">
                  <p className={`text-xs leading-relaxed ${!n.is_read ? 'font-medium' : 'text-muted-foreground'}`}>
                    {n.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-destructive mt-1 shrink-0" />}
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
