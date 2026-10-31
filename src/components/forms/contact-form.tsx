'use client';

import { useActionState } from 'react';
import { contactAction } from '@/app/actions/contact';
import { emptyFormState } from '@/lib/form-state';
import { Button } from '@/components/controls';
import { Alert } from '@/components/ui';

export function ContactForm() {
  const [state, formAction, pending] = useActionState(contactAction, emptyFormState);

  if (state.success) {
    return (
      <div className="space-y-4">
        <Alert tone="success">{state.success}</Alert>
        <p className="text-sm text-slate-400">
          Need to send another message? Refresh this page to start a new enquiry.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="name">
            Your name
          </label>
          <input id="name" name="name" className="field-input" autoComplete="name" required />
          {state.fieldErrors?.name ? <p className="field-error">{state.fieldErrors.name}</p> : null}
        </div>
        <div>
          <label className="field-label" htmlFor="email">
            Email address
          </label>
          <input id="email" name="email" type="email" className="field-input" autoComplete="email" required />
          {state.fieldErrors?.email ? <p className="field-error">{state.fieldErrors.email}</p> : null}
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="subject">
          Subject
        </label>
        <input id="subject" name="subject" className="field-input" required />
        {state.fieldErrors?.subject ? <p className="field-error">{state.fieldErrors.subject}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="message">
          How can we help?
        </label>
        <textarea id="message" name="message" rows={5} className="field-input" required />
        {state.fieldErrors?.message ? <p className="field-error">{state.fieldErrors.message}</p> : null}
      </div>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Sending…' : 'Send message'}
      </Button>
      <p className="text-xs text-slate-500">
        We use your details only to reply to this enquiry. Nothing is shared with third parties.
      </p>
    </form>
  );
}
