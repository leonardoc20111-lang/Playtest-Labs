import type { Metadata } from 'next';
import { SUPPORT_EMAIL } from '@/lib/config';
import { ContactForm } from '@/components/forms/contact-form';
import { SectionHeading } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contact Playtest Labs about playtests, custom QA work, studio contracts or anything else. We reply to most enquiries within one working day.',
};

const channels = [
  {
    title: 'Email',
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
    body: 'Best for project questions, custom quotes and invoices.',
  },
  {
    title: 'Existing booking',
    value: 'Use your dashboard',
    href: '/dashboard',
    body: 'Fastest route for anything about a live or completed playtest — your booking reference is already attached.',
  },
  {
    title: 'Response time',
    value: 'Within 1 working day',
    href: null,
    body: 'Enquiries are handled Monday to Friday, 9am–6pm UK time.',
  },
];

export default function ContactPage() {
  return (
    <div className="container-page py-14 sm:py-20">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading
            eyebrow="Contact"
            title="Talk to the team behind the test"
            description="Whether you are weighing up a package or need a studio-scale QA plan, tell us what you are working on and we will give you a straight answer."
          />

          <div className="mt-8 space-y-3">
            {channels.map((channel) => (
              <div key={channel.title} className="surface p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{channel.title}</p>
                {channel.href ? (
                  <a href={channel.href} className="mt-1 block text-sm font-semibold text-brand-cyan hover:text-white">
                    {channel.value}
                  </a>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-white">{channel.value}</p>
                )}
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{channel.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-white">Send a message</h2>
          <p className="mt-1 text-sm text-slate-400">All fields are required unless noted.</p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
