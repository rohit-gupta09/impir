import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquareQuote, Paperclip, Phone, Building2, MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';

type DraftItem = {
  name: string;
  quantity: number;
  unit: string;
};

type DraftAttachment = {
  contentType: string;
  url: string;
  storagePath?: string;
  filename?: string;
};

type WhatsappQuoteDraft = {
  id: string;
  phone: string;
  requester_name: string;
  company_name: string;
  city: string;
  pincode: string;
  status: string;
  items: DraftItem[];
  attachments: DraftAttachment[];
  notes: string;
  created_at: string;
};

type SignedAttachment = DraftAttachment & {
  signedUrl: string | null;
};

type OutboundMessage = {
  id: string;
  draft_id: string | null;
  message: string;
  status: string;
  error_message: string | null;
  created_at: string;
};

const ORDER_PROMPT_SUFFIX = '\n\nIf you want to place the order, reply with ORDER.';

export default function AdminWhatsappQuotes() {
  const [drafts, setDrafts] = useState<WhatsappQuoteDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [signedUrls, setSignedUrls] = useState<Record<string, SignedAttachment[]>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyHistory, setReplyHistory] = useState<Record<string, OutboundMessage[]>>({});
  const [sendingDraftId, setSendingDraftId] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('whatsapp_quote_drafts')
      .select('*')
      .order('created_at', { ascending: false });

    const rows = (data || []) as WhatsappQuoteDraft[];
    setDrafts(rows);
    await preloadSignedUrls(rows);
    await fetchReplyHistory(rows.map((row) => row.id));
    setLoading(false);
  };

  const fetchReplyHistory = async (draftIds: string[]) => {
    if (draftIds.length === 0) {
      setReplyHistory({});
      return;
    }

    const { data } = await (supabase as any)
      .from('whatsapp_outbound_messages')
      .select('id, draft_id, message, status, error_message, created_at')
      .in('draft_id', draftIds)
      .order('created_at', { ascending: false });

    const next: Record<string, OutboundMessage[]> = {};
    ((data || []) as OutboundMessage[]).forEach((row) => {
      const key = row.draft_id || '';
      next[key] = [...(next[key] || []), row];
    });
    setReplyHistory(next);
  };

  const preloadSignedUrls = async (rows: WhatsappQuoteDraft[]) => {
    const next: Record<string, SignedAttachment[]> = {};

    for (const row of rows) {
      const attachments = row.attachments || [];
      const mapped: SignedAttachment[] = [];

      for (const attachment of attachments) {
        if (attachment.storagePath) {
          const { data } = await supabase.storage
            .from('whatsapp-quote-attachments')
            .createSignedUrl(attachment.storagePath, 60 * 60);

          mapped.push({
            ...attachment,
            signedUrl: data?.signedUrl || null,
          });
        } else {
          mapped.push({
            ...attachment,
            signedUrl: attachment.url || null,
          });
        }
      }

      next[row.id] = mapped;
    }

    setSignedUrls(next);
  };

  const filteredDrafts = drafts.filter((draft) => {
    const haystack = [
      draft.phone,
      draft.requester_name,
      draft.company_name,
      draft.city,
      draft.pincode,
      ...draft.items.map((item) => item.name),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(query.trim().toLowerCase());
  });

  const handleSendReply = async (draft: WhatsappQuoteDraft) => {
    const message = (replyDrafts[draft.id] || '').trim();
    if (!message) {
      toast.error('Enter a reply message first');
      return;
    }

    const outboundMessage = message.includes('reply with ORDER')
      ? message
      : `${message}${ORDER_PROMPT_SUFFIX}`;

    setSendingDraftId(draft.id);
    const { error } = await (supabase as any)
      .from('whatsapp_outbound_messages')
      .insert({
        phone: draft.phone,
        draft_id: draft.id,
        message: outboundMessage,
        status: 'pending',
      });

    if (error) {
      toast.error(error.message || 'Failed to queue WhatsApp reply');
      setSendingDraftId(null);
      return;
    }

    await (supabase as any)
      .from('whatsapp_quote_drafts')
      .update({ status: 'responded' })
      .eq('id', draft.id);

    setReplyDrafts((prev) => ({ ...prev, [draft.id]: '' }));
    await fetchDrafts();
    await fetchReplyHistory([draft.id]);
    setSendingDraftId(null);
    toast.success('Reply queued for WhatsApp delivery');
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">WhatsApp Quote Drafts</h1>
          <p className="text-sm text-muted-foreground">Review quote requests captured by the Twilio WhatsApp bot, including extracted items and uploaded attachments.</p>
        </div>
        <Badge variant="outline">{drafts.length} drafts</Badge>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by phone, company, city, or item..." className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-44 w-full" />)}
        </div>
      ) : filteredDrafts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No WhatsApp quote drafts found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDrafts.map((draft) => (
            <Card key={draft.id}>
              <CardHeader className="gap-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 font-display text-lg">
                      <MessageSquareQuote className="h-5 w-5 text-accent" />
                      WhatsApp Draft {draft.id.slice(0, 8).toUpperCase()}
                    </CardTitle>
                    <CardDescription>
                      {new Date(draft.created_at).toLocaleString()} · Status: {draft.status}
                    </CardDescription>
                  </div>
                  <Badge variant={draft.status === 'submitted' ? 'secondary' : 'outline'}>{draft.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-md border p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium"><Phone className="h-4 w-4 text-muted-foreground" /> Phone</div>
                    <p className="mt-2 text-muted-foreground">{draft.phone || '-'}</p>
                  </div>
                  <div className="rounded-md border p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium"><Building2 className="h-4 w-4 text-muted-foreground" /> Company</div>
                    <p className="mt-2 text-muted-foreground">{draft.company_name || '-'}</p>
                  </div>
                  <div className="rounded-md border p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium"><MapPin className="h-4 w-4 text-muted-foreground" /> City</div>
                    <p className="mt-2 text-muted-foreground">{draft.city || '-'}{draft.pincode ? ` · ${draft.pincode}` : ''}</p>
                  </div>
                  <div className="rounded-md border p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium"><Paperclip className="h-4 w-4 text-muted-foreground" /> Attachments</div>
                    <p className="mt-2 text-muted-foreground">{draft.attachments?.length || 0}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="font-medium">Requested Items</h2>
                  {draft.items?.length ? (
                    <div className="space-y-2">
                      {draft.items.map((item, index) => (
                        <div key={`${draft.id}-${index}`} className="rounded-md border p-3 text-sm">
                          <p className="font-medium">{item.name}</p>
                          <p className="mt-1 text-muted-foreground">Quantity: {item.quantity} · Unit: {item.unit}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No extracted items yet.</p>
                  )}
                </div>

                {signedUrls[draft.id]?.length ? (
                  <div className="space-y-2">
                    <h2 className="font-medium">Attachments</h2>
                    <div className="flex flex-wrap gap-2">
                      {signedUrls[draft.id].map((attachment, index) => (
                        <Button key={`${draft.id}-attachment-${index}`} variant="outline" asChild>
                          <a href={attachment.signedUrl || '#'} target="_blank" rel="noreferrer">
                            {attachment.filename || attachment.contentType || `Attachment ${index + 1}`}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {draft.notes ? (
                  <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    {draft.notes}
                  </div>
                ) : null}

                <div className="space-y-3 rounded-md border p-4">
                  <div>
                    <h2 className="font-medium">Reply On WhatsApp</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Queue a reply to be sent through the running WhatsApp bot service.</p>
                  </div>
                  <Textarea
                    value={replyDrafts[draft.id] || ''}
                    onChange={(event) => setReplyDrafts((prev) => ({ ...prev, [draft.id]: event.target.value }))}
                    rows={3}
                    placeholder="Thank you. We are reviewing your quote request and will share the quotation shortly."
                  />
                  <div className="flex items-center gap-3">
                    <Button onClick={() => handleSendReply(draft)} disabled={sendingDraftId === draft.id}>
                      {sendingDraftId === draft.id ? 'Queueing...' : 'Send WhatsApp Reply'}
                    </Button>
                    <span className="text-xs text-muted-foreground">Phone: {draft.phone}</span>
                  </div>

                  {replyHistory[draft.id]?.length ? (
                    <div className="space-y-2 pt-2">
                      <h3 className="text-sm font-medium">Reply History</h3>
                      {replyHistory[draft.id].map((reply) => (
                        <div key={reply.id} className="rounded-md border bg-muted/30 p-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <Badge variant={reply.status === 'sent' ? 'secondary' : reply.status === 'failed' ? 'destructive' : 'outline'}>
                              {reply.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{new Date(reply.created_at).toLocaleString()}</span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap">{reply.message}</p>
                          {reply.error_message ? <p className="mt-2 text-xs text-destructive">{reply.error_message}</p> : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
