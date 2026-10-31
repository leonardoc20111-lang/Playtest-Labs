'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { loginAction } from '@/app/actions/auth';
import { emptyFormState } from '@/lib/form-state';
import { Button } from '@/components/controls';
import { Alert } from '@/components/ui';

export function LoginForm({ next }: { next?: string | null }) {
  const [state, formAction, pending] = useActionState(loginAction, emptyFormState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div>
        <label className="field-label" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="field-input"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
        {state.fieldErrors?.email ? <p className="field-error">{state.fieldErrors.email}</p> : null}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <Link href="/forgot-password" className="mb-1.5 text-xs font-medium text-brand-cyan hover:text-white">
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="field-input"
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        {state.fieldErrors?.password ? <p className="field-error">{state.fieldErrors.password}</p> : null}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
