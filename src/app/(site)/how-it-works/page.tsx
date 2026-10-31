import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonClass } from '@/components/controls';
import { SectionHeading } from '@/components/ui';

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    'How Playtest Labs runs a playtest: submit your build, we schedule and test it, then you receive a structured twelve-section report in your dashboard.',
};

const steps = [
  {
    step: '01',
    title: 'Create your account',
    body: 'Register with your email so your bookings, payment records and reports stay in one place. You can add company details in account settings.',
  },
  {
    step: '02',
    title: 'Submit your booking',
    body: 'Pick a service, add your game name and link, choose the platform, describe your game and tell us what to focus on. You get a unique booking reference immediately.',
  },
  {
    step: '03',
    title: 'Acceptance & payment',
    body: 'An administrator reviews the request and accepts or declines it. Once accepted, a Revolut payment request appears in your dashboard. Add your Revolut reference and we verify it manually.',
  },
  {
    step: '04',
    title: 'Testing happens',
    body: 'A tester is assigned and your booking moves to In Progress. We play the agreed amount of time and record issues, mechanics, performance and UX notes.',
  },
  {
    step: '05',
    title: 'Report published',
    body: 'The structured report is written, saved and published to your dashboard. You receive a notification the moment it is visible.',
  },
  {
    step: '06',
    title: 'Review & retest',
    body: 'Leave a rating and review once the booking is complete. When your fixes are in, book an Update Retest and we check the previous issues plus anything new.',
  },
];

const reportSections = [
  ['Game name & platform', 'Which build was tested and on what hardware or platform.'],
  ['Tester & testing date', 'Who performed the test and exactly when it happened.'],
  ['Overall impression', 'The honest high-level verdict from a first-time player.'],
  ['Gameplay experience', 'How the core loop felt: pacing, clarity, engagement.'],
  ['Game mechanics', 'Moment-to-moment systems, controls, progression and balance.'],
  ['Bugs discovered', 'Reproducible issues written so a developer can act on them.'],
  ['Performance observations', 'Frame stability, loading, lag spikes and pop-in.'],
  ['User experience', 'Onboarding, UI clarity, accessibility and friction points.'],
  ['Suggested improvements', 'Prioritised, realistic changes worth making next.'],
  ['Additional comments', 'Anything that did not fit above, including retest notes.'],
  ['Overall rating', 'A single score out of 10 so you can benchmark builds.'],
  ['Status', 'Drafts are private; published reports are visible to you immediately.'],
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="border-b border-white/[0.06]">
        <div className="container-page py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow mx-auto">The process</p>
            <h1 className="display-xl mt-6 text-balance">
              Clear process, <span className="gradient-text">no guesswork</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400">
              You always know what stage your playtest is at. Every status change is recorded on your booking and
              surfaced in your dashboard notifications.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-16">
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((item) => (
            <li key={item.step} className="surface surface-hover flex h-full flex-col p-6">
              <span className="font-display text-2xl font-semibold text-white/15">{item.step}</span>
              <h2 className="mt-3 text-base font-semibold text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-white/[0.06] bg-ink-900/40 py-14 sm:py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Inside the report"
            title="Twelve sections, every single time"
            description="Consistent structure makes it easy to compare builds and hand findings to your team."
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {reportSections.map(([title, description]) => (
              <div key={title} className="rounded-xl border border-white/[0.07] bg-ink-950/50 p-4">
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-16">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-brand-indigo/25 bg-brand-indigo/[0.08] px-6 py-10 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-xl font-semibold text-white">Ready to book your first playtest?</h2>
            <p className="mt-1.5 text-sm text-slate-300">Packages start at £6 and reports are delivered to your dashboard.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/book" className={buttonClass('primary', 'md')}>
              Book a test
            </Link>
            <Link href="/services" className={buttonClass('secondary', 'md')}>
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
