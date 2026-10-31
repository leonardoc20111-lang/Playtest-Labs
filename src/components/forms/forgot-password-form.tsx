'use client';

import { useActionState } from 'react';
import { forgotPasswordAction } from '@/app/actions/auth';
import { emptyFormState } from '@/lib/form-state';
import { Button } from '@/components/controls';
import { Alert } from '@/components/ui';

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, emptyFormState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      {state.data?.resetUrl ? (
        <div className="rounded-xl border border-brand-indigo/30 bg-brand-indigo/[0.08] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-cyan">Secure reset link</p>
          <a
            href={state.data.resetUrl}
            className="mt-2 block break-all text-sm font-medium text-white underline decoration-brand-indigo/60 underline-offset-4 hover:text-brand-cyan"
          >
            {state.data.resetUrl}
          </a>
          <p className="mt-2 text-xs text-slate-400">
            Open this link to choose a new password. It expires in 60 minutes and works once.
          </p>
        </div>
      ) : (
        <>
          <div>
            <label className="field-label" htmlFor="email">
              Email address
            </label>
            <input id="email" name="email" type="email" className="field-input" autoComplete="email" required />
            {state.fieldErrors?.email ? <p className="field-error">{state.fieldErrors.email}</p> : null}
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Generating…' : 'Send reset link'}
          </Button>
        </>
      )}
    </form>
  );
}
