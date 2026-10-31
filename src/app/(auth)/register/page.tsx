import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { safeNext } from '@/lib/form-state';
import { RegisterForm } from '@/components/forms/register-form';

export const metadata: Metadata = { title: 'Create an account' };
export const dynamic = 'force-dynamic';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(user.role === 'admin' ? '/admin' : '/dashboard');

  return (
    <div className="surface p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-white">Create your account</h1>
      <p className="mt-1.5 text-sm text-slate-400">
        Book playtests, follow progress and read your reports in one dashboard.
      </p>

      <div className="mt-6">
        <RegisterForm next={safeNext(params.next)} />
      </div>

      <p className="mt-6 border-t border-white/[0.07] pt-5 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-brand-cyan hover:text-white">
          Sign in
        </Link>
      </p>
    </div>
  );
}
