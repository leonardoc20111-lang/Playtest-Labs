'use client';

import { useActionState } from 'react';
import { cancelBookingAction } from '@/app/actions/booking';
import { emptyFormState } from '@/lib/form-state';
import { Button } from '@/components/controls';
import { Alert } from '@/components/ui';

export function CancelBookingForm({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(cancelBookingAction, emptyFormState);

  if (state.success) return <Alert tone="success">{state.success}</Alert>;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.fieldErrors?.reason ? <Alert tone="error">{state.fieldErrors.reason}</Alert> : null}
      <label className="field-label" htmlFor="cancel-reason">
        Cancellation reason (optional)
      </label>
      <textarea
        id="cancel-reason"
        name="reason"
        rows={2}
        maxLength={500}
        className="field-textarea"
        placeholder="Schedule clash, changed scope…"
      />
      <Button type="submit" variant="danger" size="sm" disabled={pending}>
        {pending ? 'Cancelling…' : 'Cancel this booking'}
      </Button>
      <p className="text-xs text-slate-500">
        Cancelling frees the slot immediately. Paid bookings are reviewed for a refund by our team.
      </p>
    </form>
  );
}
