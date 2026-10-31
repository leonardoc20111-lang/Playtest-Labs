import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { safeNext } from '@/lib/form-state';
import { LoginForm } from '@/components/forms/login-form';
import { Alert } from '@/components/ui';

export const metadata: Metadata = { title: 'Sign in' };
export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string; registered?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(user.role === 'admin' ? '/admin' : '/dashboard');

  return (
    <div className="surface p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-white">Welcome back</h1>
      <p className="mt-1.5 text-sm text-slate-400">Sign in to track bookings, payments and reports.</p>

      {params.reset === '1' ? (
        <div className="mt-5">
          <Alert tone="success">Your password has been updated. Sign in with your new password.</Alert>
        </div>
      ) : null}

      <div className="mt-6">
        <LoginForm next={safeNext(params.next)} />
      </div>

      <p className="mt-6 border-t border-white/[0.07] pt-5 text-center text-sm text-slate-400">
        New to Playtest Labs?{' '}
        <Link href="/register" className="font-semibold text-brand-cyan hover:text-white">
          Create an account
        </Link>
      </p>
    </div>
  );
}
