import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/forms/forgot-password-form';

export const metadata: Metadata = { title: 'Password recovery' };
export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return (
    <div className="surface p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-white">Reset your password</h1>
      <p className="mt-1.5 text-sm text-slate-400">
        Enter the email linked to your account and we will generate a secure, single-use reset link.
      </p>

      <div className="mt-6">
        <ForgotPasswordForm />
      </div>

      <p className="mt-6 border-t border-white/[0.07] pt-5 text-center text-sm text-slate-400">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-brand-cyan hover:text-white">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
