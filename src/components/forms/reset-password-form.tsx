'use client';

import { useActionState } from 'react';
import { resetPasswordAction } from '@/app/actions/auth';
import { emptyFormState } from '@/lib/form-state';
import { Button } from '@/components/controls';
import { Alert } from '@/components/ui';

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, emptyFormState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <input type="hidden" name="token" value={token} />

      <div>
        <label className="field-label" htmlFor="password">
          New password
        </label>
        <input id="password" name="password" type="password" className="field-input" autoComplete="new-password" required />
        {state.fieldErrors?.password ? <p className="field-error">{state.fieldErrors.password}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="confirmPassword">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          className="field-input"
          autoComplete="new-password"
          required
        />
        {state.fieldErrors?.confirmPassword ? <p className="field-error">{state.fieldErrors.confirmPassword}</p> : null}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Updating password…' : 'Update password'}
      </Button>
    </form>
  );
}
