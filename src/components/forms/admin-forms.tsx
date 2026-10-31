'use client';

import { useActionState } from 'react';
import {
  createSlotAction,
  createTesterAction,
  editBookingAction,
  rejectBookingAction,
  saveBookingNotesAction,
  saveReportAction,
  setBookingStatusAction,
  updatePaymentAction,
  updateServiceAction,
} from '@/app/actions/admin';
import { emptyFormState } from '@/lib/form-state';
import { Button, Field, SubmitButton } from '@/components/controls';
import { Alert } from '@/components/ui';
import { BOOKING_STATUSES, PAYMENT_STATUSES, PLATFORMS } from '@/lib/config';
import { bookingStatusLabel, paymentStatusLabel } from '@/lib/format';
import type { Booking, FeedbackReport, Payment, Service } from '@/lib/types';

export function EditBookingForm({ booking }: { booking: Booking }) {
  const [state, formAction, pending] = useActionState(editBookingAction, emptyFormState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="bookingId" value={booking.id} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Game name" htmlFor="gameName" error={state.fieldErrors?.gameName}>
          <input id="gameName" name="gameName" className="field-input" defaultValue={booking.gameName} required />
        </Field>
        <Field label="Game link" htmlFor="gameUrl" error={state.fieldErrors?.gameUrl}>
          <input id="gameUrl" name="gameUrl" className="field-input" defaultValue={booking.gameUrl} required />
        </Field>
        <Field label="Platform" htmlFor="platform" error={state.fieldErrors?.platform}>
          <select id="platform" name="platform" className="field-input" defaultValue={booking.platform}>
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Requested date" htmlFor="requestedDate" error={state.fieldErrors?.requestedDate}>
          <input
            id="requestedDate"
            name="requestedDate"
            type="date"
            className="field-input"
            defaultValue={booking.requestedDate}
            required
          />
        </Field>
        <Field label="Requested time" htmlFor="requestedTime" error={state.fieldErrors?.requestedTime}>
          <input
            id="requestedTime"
            name="requestedTime"
            type="time"
            className="field-input"
            defaultValue={booking.requestedTime}
            required
          />
        </Field>
        <Field label="Contact name" htmlFor="contactName" error={state.fieldErrors?.contactName}>
          <input id="contactName" name="contactName" className="field-input" defaultValue={booking.contactName} required />
        </Field>
        <Field label="Contact email" htmlFor="contactEmail" error={state.fieldErrors?.contactEmail}>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            className="field-input"
            defaultValue={booking.contactEmail}
            required
          />
        </Field>
        <Field label="Contact phone" htmlFor="contactPhone" error={state.fieldErrors?.contactPhone}>
          <input id="contactPhone" name="contactPhone" className="field-input" defaultValue={booking.contactPhone ?? ''} />
        </Field>
      </div>

      <Field label="Internal notes" htmlFor="internalNotes" error={state.fieldErrors?.internalNotes}>
        <textarea
          id="internalNotes"
          name="internalNotes"
          rows={3}
          className="field-input"
          defaultValue={booking.internalNotes ?? ''}
          placeholder="Only visible to staff."
        />
      </Field>

      <SubmitButton pending={pending} size="sm">
        Save booking details
      </SubmitButton>
    </form>
  );
}

export function BookingNotesForm({ bookingId, notes }: { bookingId: string; notes: string | null }) {
  const [state, formAction, pending] = useActionState(saveBookingNotesAction, emptyFormState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <textarea
        name="internalNotes"
        rows={4}
        className="field-input"
        defaultValue={notes ?? ''}
        placeholder="Tester notes, blockers, customer context…"
        aria-label="Internal notes"
      />
      <SubmitButton pending={pending} variant="secondary" size="sm">
        Save notes
      </SubmitButton>
    </form>
  );
}

export function PaymentForm({ bookingId, payment }: { bookingId: string; payment: Payment }) {
  const [state, formAction, pending] = useActionState(updatePaymentAction, emptyFormState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Payment status"
          htmlFor={`status-${bookingId}`}
          hint="Only set Paid once the Revolut transfer is confirmed."
        >
          <select id={`status-${bookingId}`} name="status" className="field-input" defaultValue={payment.status}>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {paymentStatusLabel[status]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Revolut payment link" htmlFor={`link-${bookingId}`}>
          <input
            id={`link-${bookingId}`}
            name="paymentLink"
            className="field-input"
            defaultValue={payment.paymentLink ?? ''}
            placeholder="https://revolut.me/your-handle"
          />
        </Field>
        <Field label="Payment reference" htmlFor={`ref-${bookingId}`} hint="Revolut transaction reference.">
          <input
            id={`ref-${bookingId}`}
            name="paymentReference"
            className="field-input"
            defaultValue={payment.paymentReference ?? ''}
          />
        </Field>
        <Field label="Refund reference" htmlFor={`refund-${bookingId}`}>
          <input
            id={`refund-${bookingId}`}
            name="refundReference"
            className="field-input"
            defaultValue={payment.refundReference ?? ''}
          />
        </Field>
      </div>

      <Field label="Admin note" htmlFor={`note-${bookingId}`} hint="Visible to customers on their payments page.">
        <textarea id={`note-${bookingId}`} name="adminNote" rows={2} className="field-input" defaultValue={payment.adminNote ?? ''} />
      </Field>

      <SubmitButton pending={pending} size="sm">
        Update payment
      </SubmitButton>
    </form>
  );
}

export function BookingStatusForm({ bookingId, status }: { bookingId: string; status: Booking['status'] }) {
  return (
    <form action={setBookingStatusAction} className="space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
        <Field label="Booking status" htmlFor={`booking-status-${bookingId}`}>
          <select id={`booking-status-${bookingId}`} name="status" className="field-input" defaultValue={status}>
            {BOOKING_STATUSES.map((option) => (
              <option key={option} value={option}>
                {bookingStatusLabel[option]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status note (optional)" htmlFor={`booking-note-${bookingId}`} hint="Included in the customer notification.">
          <input id={`booking-note-${bookingId}`} name="note" className="field-input" placeholder="Starting testing at 18:00 GMT" />
        </Field>
      </div>
      <SubmitButton pending={pending} variant="secondary" size="sm">
        Update status
      </SubmitButton>
    </form>
  );
}

export function RejectBookingForm({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(rejectBookingAction, emptyFormState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <Field label="Rejection reason" htmlFor={`reject-${bookingId}`} error={state.fieldErrors?.reason}>
        <textarea
          id={`reject-${bookingId}`}
          name="reason"
          rows={2}
          className="field-input"
          placeholder="No tester availability for that platform."
        />
      </Field>
      <SubmitButton pending={pending} variant="danger" size="sm">
        Reject request
      </SubmitButton>
    </form>
  );
}

const REPORT_SECTIONS: Array<{ name: keyof FeedbackReport; label: string; hint: string; rows: number }> = [
  { name: 'overallImpression', label: '1. Overall impression', hint: 'Headline verdict on the game.', rows: 3 },
  { name: 'gameplayExperience', label: '2. Gameplay experience', hint: 'Core loop, pacing, replayability.', rows: 4 },
  { name: 'gameMechanics', label: '3. Game mechanics', hint: 'Systems, controls, balance, progression.', rows: 4 },
  { name: 'bugsDiscovered', label: '4. Bugs discovered', hint: 'Each bug: where it happened, what happened, severity.', rows: 4 },
  { name: 'performanceObservations', label: '5. Performance observations', hint: 'Frame rate, loading, crashes, network.', rows: 3 },
  { name: 'userExperience', label: '6. User experience', hint: 'Onboarding, UI clarity, accessibility.', rows: 3 },
  { name: 'suggestedImprovements', label: '7. Suggested improvements', hint: 'Prioritised, actionable changes.', rows: 4 },
  { name: 'additionalComments', label: '8. Additional comments', hint: 'Optional context, next steps, retest advice.', rows: 3 },
];

export function ReportForm({
  booking,
  report,
  defaultTesterName,
  platform,
}: {
  booking: Booking;
  report: FeedbackReport | null;
  defaultTesterName: string;
  platform: string;
}) {
  const [state, formAction, pending] = useActionState(saveReportAction, emptyFormState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="bookingId" value={booking.id} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Game name" htmlFor="reportGameName" error={state.fieldErrors?.gameName}>
          <input
            id="reportGameName"
            name="gameName"
            className="field-input"
            defaultValue={report?.gameName ?? booking.gameName}
            required
          />
        </Field>
        <Field label="Tester name" htmlFor="testerName" error={state.fieldErrors?.testerName}>
          <input
            id="testerName"
            name="testerName"
            className="field-input"
            defaultValue={report?.testerName ?? defaultTesterName}
            required
          />
        </Field>
        <Field label="Platform" htmlFor="reportPlatform" error={state.fieldErrors?.platform}>
          <select id="reportPlatform" name="platform" className="field-input" defaultValue={report?.platform ?? platform}>
            {PLATFORMS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Testing date" htmlFor="testingDate" error={state.fieldErrors?.testingDate}>
          <input
            id="testingDate"
            name="testingDate"
            type="date"
            className="field-input"
            defaultValue={report?.testingDate ?? new Date().toISOString().slice(0, 10)}
            required
          />
        </Field>
      </div>

      {REPORT_SECTIONS.map((section) => (
        <Field
          key={section.name}
          label={section.label}
          htmlFor={String(section.name)}
          error={state.fieldErrors?.[String(section.name)]}
          hint={section.hint}
        >
          <textarea
            id={String(section.name)}
            name={String(section.name)}
            rows={section.rows}
            className="field-input"
            defaultValue={(report?.[section.name] as string | null) ?? ''}
            required={section.name !== 'additionalComments'}
          />
        </Field>
      ))}

      <Field label="Overall rating (out of 10)" htmlFor="overallRating" error={state.fieldErrors?.overallRating}>
        <input
          id="overallRating"
          name="overallRating"
          type="number"
          min={0}
          max={10}
          step={0.5}
          className="field-input max-w-32"
          defaultValue={report?.overallRating ?? 7}
          required
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-4">
        <Button type="submit" name="intent" value="draft" variant="secondary" size="sm" disabled={pending}>
          {pending ? 'Saving…' : 'Save draft'}
        </Button>
        <Button type="submit" name="intent" value="publish" size="sm" disabled={pending}>
          {report?.status === 'published' ? 'Update published report' : 'Publish report'}
        </Button>
        <span className="text-xs text-slate-500">Publishing notifies the customer instantly.</span>
      </div>
    </form>
  );
}

export function ServiceForm({ service }: { service: Service }) {
  const [state, formAction, pending] = useActionState(updateServiceAction, emptyFormState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="serviceId" value={service.id} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Service name" htmlFor={`name-${service.id}`} error={state.fieldErrors?.name}>
          <input id={`name-${service.id}`} name="name" className="field-input" defaultValue={service.name} required />
        </Field>
        <Field label="Tagline" htmlFor={`tagline-${service.id}`} error={state.fieldErrors?.tagline}>
          <input id={`tagline-${service.id}`} name="tagline" className="field-input" defaultValue={service.tagline} />
        </Field>
        <Field label="Price (£)" htmlFor={`price-${service.id}`} error={state.fieldErrors?.pricePence}>
          <input
            id={`price-${service.id}`}
            name="pricePence"
            type="number"
            min={0}
            step={0.5}
            className="field-input"
            defaultValue={(service.pricePence / 100).toFixed(2)}
            required
          />
        </Field>
        <Field label="Duration (minutes)" htmlFor={`duration-${service.id}`} error={state.fieldErrors?.durationMinutes}>
          <input
            id={`duration-${service.id}`}
            name="durationMinutes"
            type="number"
            min={5}
            max={600}
            step={5}
            className="field-input"
            defaultValue={service.durationMinutes}
            required
          />
        </Field>
      </div>

      <Field label="Description" htmlFor={`desc-${service.id}`} error={state.fieldErrors?.description}>
        <textarea
          id={`desc-${service.id}`}
          name="description"
          rows={3}
          className="field-input"
          defaultValue={service.description}
          required
        />
      </Field>

      <label className="flex items-center gap-2.5 text-sm text-slate-300">
        <input
          type="checkbox"
          name="active"
          defaultChecked={service.active}
          className="h-4 w-4 rounded border-white/20 bg-ink-900 text-brand-indigo focus:ring-brand-indigo/40"
        />
        Bookable on the public site
      </label>

      <SubmitButton pending={pending} size="sm">
        Save service
      </SubmitButton>
    </form>
  );
}

export function AvailabilityForm() {
  const [state, formAction, pending] = useActionState(createSlotAction, emptyFormState);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Date" htmlFor="slotDate" error={state.fieldErrors?.date}>
          <input id="slotDate" name="date" type="date" min={today} className="field-input" defaultValue={today} required />
        </Field>
        <Field label="Start time" htmlFor="slotStart" error={state.fieldErrors?.startTime}>
          <input id="slotStart" name="startTime" type="time" className="field-input" defaultValue="18:00" required />
        </Field>
        <Field label="End time" htmlFor="slotEnd" error={state.fieldErrors?.endTime}>
          <input id="slotEnd" name="endTime" type="time" className="field-input" defaultValue="21:00" required />
        </Field>
        <Field label="Capacity" htmlFor="slotCapacity" error={state.fieldErrors?.capacity}>
          <input
            id="slotCapacity"
            name="capacity"
            type="number"
            min={1}
            max={20}
            className="field-input"
            defaultValue={1}
            required
          />
        </Field>
      </div>

      <SubmitButton pending={pending} size="sm">
        Add availability slot
      </SubmitButton>
    </form>
  );
}

export function TesterForm() {
  const [state, formAction, pending] = useActionState(createTesterAction, emptyFormState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Tester name" htmlFor="testerFullName" error={state.fieldErrors?.fullName}>
          <input id="testerFullName" name="fullName" className="field-input" required />
        </Field>
        <Field label="Email" htmlFor="testerEmail" error={state.fieldErrors?.email}>
          <input id="testerEmail" name="email" type="email" className="field-input" required />
        </Field>
        <Field label="Temporary password" htmlFor="testerPassword" error={state.fieldErrors?.password} hint="Min. 8 characters.">
          <input id="testerPassword" name="password" type="text" className="field-input" required minLength={8} />
        </Field>
      </div>

      <SubmitButton pending={pending} size="sm">
        Create tester account
      </SubmitButton>
    </form>
  );
}
