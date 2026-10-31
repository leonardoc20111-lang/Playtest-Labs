import type { Metadata } from 'next';
import Link from 'next/link';
import { getPasswordReset } from '@/lib/data/repos';
import { ResetPasswordForm } from '@/components/forms/reset-password-form';
import { Alert } from '@/components/ui';

export const metadata: Metadata = { title: 'Choose a new password' };
export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const reset = token ? await getPasswordReset(token) : null;

  if (!token || !reset) {
    return (
      <div className="surface p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-white">Link not valid</h1>
        <div className="mt-5">
          <Alert tone="error">
            This password reset link is invalid, has already been used, or has expired. Request a new one to continue.
          </Alert>
        </div>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm font-semibold text-brand-cyan hover:text-white"
        >
          Request a new reset link →
        </Link>
      </div>
    );
  }

  return (
    <div className="surface p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-white">Choose a new password</h1>
      <p className="mt-1.5 text-sm text-slate-400">
        Resetting the password for <span className="font-medium text-slate-200">{reset.email}</span>. All other sessions
        will be signed out.
      </p>

      <div className="mt-6">
        <ResetPasswordForm token={token} />
      </div>

      <p className="mt-6 border-t border-white/[0.07] pt-5 text-center text-sm text-slate-400">
        <Link href="/login" className="font-semibold text-brand-cyan hover:text-white">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
