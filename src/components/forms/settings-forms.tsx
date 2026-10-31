'use client';

import { useActionState } from 'react';
import { changePasswordAction, updateProfileAction } from '@/app/actions/auth';
import { emptyFormState } from '@/lib/form-state';
import { Button, Field } from '@/components/controls';
import { Alert } from '@/components/ui';
import type { Profile } from '@/lib/types';

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, emptyFormState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" error={state.fieldErrors?.fullName}>
          <input id="fullName" name="fullName" className="field-input" defaultValue={profile.fullName} required />
        </Field>
        <Field label="Email" htmlFor="email" hint="Contact us to change the email on your account.">
          <input id="email" name="email" className="field-input" defaultValue={profile.email} disabled />
        </Field>
        <Field label="Display name" htmlFor="displayName" error={state.fieldErrors?.displayName} hint="Used on reviews.">
          <input id="displayName" name="displayName" className="field-input" defaultValue={profile.displayName ?? ''} />
        </Field>
        <Field label="Studio / company" htmlFor="company" error={state.fieldErrors?.company}>
          <input id="company" name="company" className="field-input" defaultValue={profile.company ?? ''} />
        </Field>
        <Field label="Phone" htmlFor="phone" error={state.fieldErrors?.phone}>
          <input id="phone" name="phone" className="field-input" defaultValue={profile.phone ?? ''} placeholder="+44 7700 900123" />
        </Field>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-slate-300">
        <input
          type="checkbox"
          name="marketingOptIn"
          defaultChecked={profile.marketingOptIn}
          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-ink-900 text-brand-indigo focus:ring-brand-indigo/40"
        />
        <span>Send me occasional updates about new packages and testing slots.</span>
      </label>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? 'Saving…' : 'Save profile'}
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, emptyFormState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <Field label="Current password" htmlFor="currentPassword" error={state.fieldErrors?.currentPassword}>
        <input id="currentPassword" name="currentPassword" type="password" className="field-input" autoComplete="current-password" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" htmlFor="newPassword" error={state.fieldErrors?.password} hint="At least 8 characters.">
          <input id="newPassword" name="password" type="password" className="field-input" autoComplete="new-password" required />
        </Field>
        <Field label="Confirm new password" htmlFor="confirmPassword" error={state.fieldErrors?.confirmPassword}>
          <input id="confirmPassword" name="confirmPassword" type="password" className="field-input" autoComplete="new-password" required />
        </Field>
      </div>
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? 'Updating…' : 'Change password'}
      </Button>
    </form>
  );
}
