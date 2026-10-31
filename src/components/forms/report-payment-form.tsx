'use client';

import { useActionState } from 'react';
import { submitReportedPaymentAction } from '@/app/actions/booking';
import { emptyFormState } from '@/lib/form-state';
import { Button, Field } from '@/components/controls';
import { Alert } from '@/components/ui';

export function ReportPaymentForm({ bookingId, disabled }: { bookingId: string; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(submitReportedPaymentAction, emptyFormState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Revolut payment reference"
          htmlFor="paymentReference"
          error={state.fieldErrors?.paymentReference}
          hint="The reference shown on your Revolut transfer."
        >
          <input id="paymentReference" name="paymentReference" className="field-input" placeholder="REV-8H21KD" disabled={disabled} required />
        </Field>
        <Field label="Note (optional)" htmlFor="customerNote" error={state.fieldErrors?.customerNote}>
          <input id="customerNote" name="customerNote" className="field-input" placeholder="Paid from joint account" disabled={disabled} />
        </Field>
      </div>
      <Button type="submit" size="sm" disabled={pending || disabled}>
        {pending ? 'Submitting…' : 'Submit payment reference'}
      </Button>
      <p className="text-xs text-slate-500">
        Payments are verified manually against Revolut. Submitting a reference does not mark the booking as paid.
      </p>
    </form>
  );
}
