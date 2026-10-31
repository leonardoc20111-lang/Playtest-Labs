'use client';

import { useActionState, useState } from 'react';
import { submitReviewAction } from '@/app/actions/booking';
import { emptyFormState } from '@/lib/form-state';
import { Button, Field } from '@/components/controls';
import { Alert } from '@/components/ui';

export function ReviewForm({ bookingId, defaultName }: { bookingId: string; defaultName: string }) {
  const [state, formAction, pending] = useActionState(submitReviewAction, emptyFormState);
  const [rating, setRating] = useState(5);

  if (state.success) return <Alert tone="success">{state.success}</Alert>;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="rating" value={rating} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <div>
        <p className="field-label">Your rating</p>
        <div className="mt-1 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} star${value === 1 ? '' : 's'}`}
              aria-pressed={rating === value}
              className="rounded-md p-1 transition hover:scale-110"
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-6 w-6 ${value <= rating ? 'text-amber-300' : 'text-slate-600'}`}
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" />
              </svg>
            </button>
          ))}
          <span className="ml-2 text-sm text-slate-400">{rating}/5</span>
        </div>
        {state.fieldErrors?.rating ? <p className="field-error">{state.fieldErrors.rating}</p> : null}
      </div>

      <Field label="Your feedback" htmlFor="comment" error={state.fieldErrors?.comment}>
        <textarea
          id="comment"
          name="comment"
          rows={4}
          className="field-textarea"
          placeholder="Clear report, quick turnaround, actionable bug list…"
          required
        />
      </Field>
      <Field
        label="Display name"
        htmlFor="displayName"
        error={state.fieldErrors?.displayName}
        hint="Shown publicly once approved. Leave blank to use your account name."
      >
        <input id="displayName" name="displayName" className="field-input" defaultValue={defaultName} />
      </Field>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? 'Submitting…' : 'Submit review'}
      </Button>
      <p className="text-xs text-slate-500">Reviews are moderated before they appear on the public site.</p>
    </form>
  );
}
