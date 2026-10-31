import type { Metadata } from 'next';
import { Badge, Card, EmptyState } from '@/components/ui';
import { Button } from '@/components/controls';
import { requireAdmin } from '@/lib/auth';
import { listContactMessages } from '@/lib/data/repos';
import { setMessageStatusAction } from '@/app/actions/admin';
import { formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin messages' };

const STATUS_TONE: Record<string, string> = {
  new: 'bg-brand-blue/10 text-brand-cyan ring-brand-blue/30',
  read: 'bg-white/5 text-slate-300 ring-white/10',
  handled: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30',
};

export default async function AdminMessagesPage() {
  await requireAdmin();
  const messages = await listContactMessages();
  const unhandled = messages.filter((message) => message.status !== 'handled').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Messages</h1>
        <p className="mt-1 text-sm text-slate-400">
          {messages.length} contact message{messages.length === 1 ? '' : 's'} · {unhandled} awaiting a reply.
        </p>
      </div>

      {messages.length === 0 ? (
        <EmptyState
          title="No messages yet"
          description="Enquiries sent through the public contact form appear here."
        />
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <Card key={message.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-white">{message.subject}</h2>
                    <Badge tone={STATUS_TONE[message.status] ?? STATUS_TONE.read}>{message.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {message.name} · {message.email} · {formatDateTime(message.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.status !== 'read' ? (
                    <form action={setMessageStatusAction}>
                      <input type="hidden" name="messageId" value={message.id} />
                      <input type="hidden" name="status" value="read" />
                      <Button type="submit" size="sm" variant="secondary">
                        Mark read
                      </Button>
                    </form>
                  ) : null}
                  {message.status !== 'handled' ? (
                    <form action={setMessageStatusAction}>
                      <input type="hidden" name="messageId" value={message.id} />
                      <input type="hidden" name="status" value="handled" />
                      <Button type="submit" size="sm">
                        Mark handled
                      </Button>
                    </form>
                  ) : (
                    <form action={setMessageStatusAction}>
                      <input type="hidden" name="messageId" value={message.id} />
                      <input type="hidden" name="status" value="new" />
                      <Button type="submit" size="sm" variant="ghost">
                        Reopen
                      </Button>
                    </form>
                  )}
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line border-t border-white/5 pt-3 text-sm leading-relaxed text-slate-300">
                {message.message}
              </p>
              <a
                href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                className="mt-3 inline-block text-xs font-semibold text-brand-cyan transition hover:text-white"
              >
                Reply by email →
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
