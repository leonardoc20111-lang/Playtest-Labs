'use client';

import { useActionState } from 'react';
import { registerAction } from '@/app/actions/auth';
import { emptyFormState } from '@/lib/form-state';
import { Button } from '@/components/controls';
import { Alert } from '@/components/ui';

export function RegisterForm({ next }: { next?: string | null }) {
  const [state, formAction, pending] = useActionState(registerAction, emptyFormState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div>
        <label className="field-label" htmlFor="fullName">
          Full name
        </label>
        <input id="fullName" name="fullName" className="field-input" autoComplete="name" required />
        {state.fieldErrors?.fullName ? <p className="field-error">{state.fieldErrors.fullName}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="email">
          Email address
        </label>
        <input id="email" name="email" type="email" className="field-input" autoComplete="email" required />
        {state.fieldErrors?.email ? <p className="field-error">{state.fieldErrors.email}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="company">
          Studio or company <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <input id="company" name="company" className="field-input" autoComplete="organization" />
        {state.fieldErrors?.company ? <p className="field-error">{state.fieldErrors.company}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="field-input"
            autoComplete="new-password"
            required
          />
          {state.fieldErrors?.password ? <p className="field-error">{state.fieldErrors.password}</p> : null}
        </div>
        <div>
          <label className="field-label" htmlFor="confirmPassword">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className="field-input"
            autoComplete="new-password"
            required
          />
          {state.fieldErrors?.confirmPassword ? (
            <p className="field-error">{state.fieldErrors.confirmPassword}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <input id="marketingOptIn" name="marketingOptIn" type="checkbox" className="mt-0.5 h-4 w-4 accent-[#6a5bff]" />
        <label htmlFor="marketingOptIn" className="text-xs leading-relaxed text-slate-400">
          Email me occasional Playtest Labs updates. You can turn this off at any time in account settings.
        </label>
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-center text-[11px] leading-relaxed text-slate-500">
        By creating an account you agree to our fair-use policy. Playtests are subject to availability and admin
        acceptance.
      </p>
    </form>
  );
}
