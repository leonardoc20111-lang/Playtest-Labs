import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/controls';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-16rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-brand-indigo/20 blur-[130px]" />
        <div className="absolute bottom-[-10rem] right-[-6rem] h-[24rem] w-[24rem] rounded-full bg-brand-violet/15 blur-[120px]" />
      </div>

      <header className="container-page flex h-16 items-center justify-between">
        <Link href="/" aria-label="Playtest Labs home">
          <Logo />
        </Link>
        <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-white">
          ← Back to site
        </Link>
      </header>

      <main id="main" className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="container-page py-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Playtest Labs · Professional game QA
      </footer>
    </div>
  );
}
