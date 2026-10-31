'use client';

import { useActionState, useMemo, useState } from 'react';
import { createBookingAction } from '@/app/actions/booking';
import { emptyFormState } from '@/lib/form-state';
import { Button, Field } from '@/components/controls';
import { Alert } from '@/components/ui';
import { formatGBP } from '@/lib/format';
import { PLATFORMS } from '@/lib/config';

export interface BookingServiceOption {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  pricePence: number;
  durationMinutes: number;
}

export interface AvailabilityDay {
  date: string;
  label: string;
  slots: { time: string; label: string; remaining: number }[];
}

export function BookingForm({
  services,
  days,
  defaults,
  initialService,
}: {
  services: BookingServiceOption[];
  days: AvailabilityDay[];
  defaults: { contactName: string; contactEmail: string };
  initialService?: string;
}) {
  const [state, formAction, pending] = useActionState(createBookingAction, emptyFormState);
  const [serviceId, setServiceId] = useState(
    services.find((service) => service.slug === initialService)?.id ?? services[0]?.id ?? '',
  );
  const [date, setDate] = useState(days[0]?.date ?? '');
  const [time, setTime] = useState(days[0]?.slots[0]?.time ?? '');

  const selectedService = useMemo(() => services.find((service) => service.id === serviceId), [services, serviceId]);
  const dayOptions = days;
  const slotOptions = useMemo(() => days.find((day) => day.date === date)?.slots ?? [], [days, date]);
  const errors = state.fieldErrors ?? {};

  function handleDateChange(next: string) {
    setDate(next);
    const nextSlots = days.find((day) => day.date === next)?.slots ?? [];
    setTime(nextSlots[0]?.time ?? '');
    // Hidden inputs carry the selection, so keep it valid when the date changes.
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="requestedDate" value={date} />
      <input type="hidden" name="requestedTime" value={time} />

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <fieldset className="space-y-5">
        <legend className="section-eyebrow">1. Choose your package</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((service) => {
            const active = service.id === serviceId;
            return (
              <label
                key={service.id}
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                  active
                    ? 'border-brand-violet/70 bg-brand-violet/10 ring-1 ring-brand-violet/40'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                }`}
              >
                <input
                  type="radio"
                  name="serviceId"
                  value={service.id}
                  checked={active}
                  onChange={() => setServiceId(service.id)}
                  className="sr-only"
                />
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-white">{service.name}</span>
                  <span className="text-sm font-semibold text-brand-cyan">{formatGBP(service.pricePence)}</span>
                </span>
                <span className="mt-1 block text-xs text-slate-400">{service.tagline}</span>
                <span className="mt-2 block text-[11px] uppercase tracking-wider text-slate-500">
                  {service.durationMinutes} minutes of testing
                </span>
              </label>
            );
          })}
        </div>
        {errors.serviceId ? <p className="field-error">{errors.serviceId}</p> : null}
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="section-eyebrow">2. Your game</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Game name" htmlFor="gameName" error={errors.gameName}>
            <input id="gameName" name="gameName" className="field-input" placeholder="Neon Drift Racers" required />
          </Field>
          <Field label="Game link" htmlFor="gameUrl" error={errors.gameUrl} hint="Roblox place link, Steam page, itch.io or build URL.">
            <input
              id="gameUrl"
              name="gameUrl"
              className="field-input"
              placeholder="https://www.roblox.com/games/…"
              required
            />
          </Field>
          <Field label="Testing platform" htmlFor="platform" error={errors.platform}>
            <select id="platform" name="platform" className="field-input" defaultValue="Roblox">
              {PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Additional instructions" htmlFor="additionalInstructions" error={errors.additionalInstructions} hint="Optional: controls, areas to focus on, known issues.">
            <input id="additionalInstructions" name="additionalInstructions" className="field-input" placeholder="Focus on tutorial onboarding" />
          </Field>
        </div>
        <Field
          label="Game description"
          htmlFor="gameDescription"
          error={errors.gameDescription}
          hint="What is the game, who is it for, and what should we test?"
        >
          <textarea
            id="gameDescription"
            name="gameDescription"
            rows={4}
            className="field-textarea"
            placeholder="An arcade racer for Roblox with drift mechanics, 12 tracks and a lobby system…"
            required
          />
        </Field>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="section-eyebrow">3. Preferred testing slot</legend>
        {dayOptions.length === 0 ? (
          <Alert tone="warning">
            No open slots are currently published. Submit the form to request a slot and our team will confirm a time by email.
          </Alert>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Date" htmlFor="datePicker" error={errors.requestedDate}>
              <select
                id="datePicker"
                className="field-input"
                value={date}
                onChange={(event) => handleDateChange(event.target.value)}
              >
                {dayOptions.map((day) => (
                  <option key={day.date} value={day.date}>
                    {day.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Time (UK)" htmlFor="timePicker" error={errors.requestedTime}>
              <select
                id="timePicker"
                className="field-input"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              >
                {slotOptions.map((slot) => (
                  <option key={slot.time} value={slot.time}>
                    {slot.label} · {slot.remaining} place{slot.remaining === 1 ? '' : 's'} left
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
        <p className="text-xs text-slate-500">
          Slots are shown in UK time and limited by tester capacity — a slot disappears once it is full.
        </p>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="section-eyebrow">4. Contact details</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Contact name" htmlFor="contactName" error={errors.contactName}>
            <input
              id="contactName"
              name="contactName"
              className="field-input"
              defaultValue={defaults.contactName}
              required
            />
          </Field>
          <Field label="Contact email" htmlFor="contactEmail" error={errors.contactEmail}>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              className="field-input"
              defaultValue={defaults.contactEmail}
              required
            />
          </Field>
          <Field label="Phone / Discord" htmlFor="contactPhone" error={errors.contactPhone} hint="Optional, used for scheduling questions.">
            <input irthid="contactPhone" id="contactPhone" name="contactPhone" className="field-input" />
          </Field>
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">
          {selectedService ? (
            <>
              Total <span className="font-semibold text-white">{formatGBP(selectedService.pricePence)}</span> · payment
              requested after we accept your booking.
            </>
          ) : (
            'Choose a package to see pricing.'
          )}
        </p>
        <Button type="submit" size="lg" disabled={pending || services.length === 0}>
          {pending ? 'Submitting…' : 'Submit booking request'}
        </Button>
      </div>
      <p className="text-xs text-slate-500">
        No payment is taken now. We confirm the slot and send a Revolut payment link once a tester is assigned.
      </p>
    </form>
  );
}
