import type { Metadata } from 'next';
import { Card } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { PasswordForm, ProfileForm } from '@/components/forms/settings-forms';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Account settings' };

export default async function SettingsPage() {
  const user = await requireUser('/dashboard/settings');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Account settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your profile details and password. Member since {formatDate(user.createdAt)}.
        </p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-white">Profile</h2>
        <p className="mt-1 text-sm text-slate-500">These details pre-fill new bookings and appear on reports.</p>
        <div className="mt-5">
          <ProfileForm profile={user} />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-white">Password</h2>
        <p className="mt-1 text-sm text-slate-500">Use at least 8 characters and avoid reusing passwords.</p>
        <div className="mt-5">
          <PasswordForm />
        </div>
      </Card>
    </div>
  );
}
