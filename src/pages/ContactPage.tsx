import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MapPin, Phone, Mail, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.functions.invoke('contact-form', {
      body: form,
    });
    setLoading(false);
    if (error) { toast.error('Failed to send message'); return; }
    setSent(true);
    toast.success('Message sent!');
  };

  return (
    <div className="space-y-4 max-w-4xl animate-slide-in">
      <h1 className="font-display text-2xl font-bold">Contact Us</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card className="border">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <div><p className="font-medium text-sm">Address</p><p className="text-xs text-muted-foreground">Tej mandi, Alwar</p></div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <div><p className="font-medium text-sm">Phone</p><p className="text-xs text-muted-foreground">+91 8306357208</p></div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <div><p className="font-medium text-sm">Email</p><p className="text-xs text-muted-foreground">supportromart@gmail.com</p></div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <div><p className="font-medium text-sm">Business Hours</p><p className="text-xs text-muted-foreground">Mon-Sat: 9:00 AM - 7:00 PM<br />Sun: 10:00 AM - 4:00 PM</p></div>
              </div>
            </CardContent>
          </Card>

          {/* Map placeholder */}
          <Card className="border">
            <CardContent className="p-0">
              <div className="w-full h-48 bg-muted rounded flex items-center justify-center">
                <MapPin className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground ml-2">Map View</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border">
          <CardContent className="p-5">
            {sent ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle className="w-12 h-12 text-status-responded mx-auto" />
                <h3 className="font-display text-lg font-bold">Message Sent!</h3>
                <p className="text-sm text-muted-foreground">We'll get back to you soon.</p>
                <Button variant="outline" onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>Send Another</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <h3 className="font-display text-lg font-bold">Send us a Message</h3>
                <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={update('name')} required /></div>
                <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={update('email')} required /></div>
                <div className="space-y-1"><Label>Subject</Label><Input value={form.subject} onChange={update('subject')} required /></div>
                <div className="space-y-1"><Label>Message</Label><Textarea value={form.message} onChange={update('message')} required rows={4} /></div>
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-display tracking-wide" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} SEND MESSAGE
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
