'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import {
  availabilitySchema,
  bookingEditSchema,
  bookingStatusSchema,
  fieldErrors,
  paymentUpdateSchema,
  reportSchema,
  serviceSchema,
} from '@/lib/validation';
import type { FormState } from '@/lib/form-state';
import {
  assignTester,
  createAvailabilitySlot,
  createNotification,
  createTesterAccount,
  deleteSlot,
  getBookingById,
  getBookingByReference,
  getPaymentByBookingId,
} from '@/lib/data/repos';
import { getProfileById } from '@/lib/data/repos';
import {
  moderateReview,
  saveReport,
  setContactMessageStatus,
  setProfileRole,
  setReportStatus,
  setSlotOpen,
  unassignTester,
  updateBooking,
  updatePayment,
  updateService,
} from '@/lib/data/repos';
import type { BookingStatus } from '@/lib/types';

/** Every admin mutation re-checks the session role on the server. */
async function admin(): Promise<{ id: string; fullName: string } | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return { id: user.id, fullName: user.fullName };
}

function revalidateAdminBooking(reference?: string | null) {
  revalidatePath('/admin');
  revalidatePath('/admin/bookings');
  revalidatePath('/admin/payments');
  revalidatePath('/admin/reports');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/bookings');
  revalidatePath('/dashboard/payments');
  revalidatePath('/dashboard/notifications');
  if (reference) {
    revalidatePath(`/admin/bookings/${reference}`);
    revalidatePath(`/dashboard/bookings/${reference}`);
  }
}

async function notify(
  userId: string,
  type: string,
  title: string,
  body?: string,
  link?: string | null,
): Promise<void> {
  if (!userId) return;
  await createNotification({ userId, type, title, body, link: link ?? null });
}

/* ------------------------------------------------------------- bookings */

export async function acceptBookingAction(formData: FormData): Promise<void> {
  const staff = await admin();
  if (!staff) return;
  const bookingId = String(formData.get('bookingId') ?? '');
  const paymentLink = String(formData.get('paymentLink') ?? '').trim();
  const booking = await getBookingById(bookingId);
  if (!booking) return;

  await updateBooking(bookingId, { status: 'accepted' });
  const payment = await getPaymentByBookingId(bookingId);
  if (payment) {
    await updatePayment(bookingId, {
      status: payment.status === 'paid' ? 'paid' : 'payment_requested',
      paymentLink: paymentLink || payment.paymentLink || null,
    });
  }

  await notify(
    booking.customerId,
    'booking_accepted',
    `Booking ${booking.reference} accepted`,
    `Great news — we have accepted your ${booking.gameName} playtest. ${
      paymentLink
        ? 'A Revolut payment link is now available on your booking page.'
        : 'We will share payment details shortly.'
    }`,
    `/dashboard/bookings/${booking.reference}`,
  );
  await notify(
    booking.customerId,
    'payment_requested',
    'Payment requested',
    `Payment details for booking ${booking.reference} are ready. Amount: £${(booking.pricePence / 100).toFixed(2)}.`,
    `/dashboard/bookings/${booking.reference}`,
  );
  revalidateAdminBooking(booking.reference);
}

export async function rejectBookingAction(formData: FormData): Promise<void> {
  const staff = await admin();
  if (!staff) return;
  const bookingId = String(formData.get('bookingId') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  const booking = await getBookingById(bookingId);
  if (!booking) return;
  await updateBooking(bookingId, {
    status: 'cancelled',
    cancelledReason: reason || 'We could not accommodate this request. Please contact us to rearrange.',
  });
  await notify(
    booking.customerId,
    'booking_cancelled',
    `Booking ${booking.reference} cancelled`,
    reason
      ? `Your booking for ${booking.gameName} was cancelled: ${reason}`
      : `Your booking for ${booking.gameName} was cancelled. Contact us and we can rearrange.`,
    `/dashboard/bookings/${booking.reference}`,
  );
  revalidateAdminBooking(booking.reference);
}

export async function setBookingStatusAction(formData: FormData): Promise<void> {
  const staff = await admin();
  if (!staff) return;
  const parsed = bookingStatusSchema.safeParse({
    bookingId: formData.get('bookingId'),
    status: formData.get('status'),
    note: formData.get('note') ?? '',
  });
  if (!parsed.success) return;
  const booking = await getBookingById(parsed.data.bookingId);
  if (!booking) return;
  const next = parsed.data.status as BookingStatus;

  await updateBooking(booking.id, {
    status: next,
    ...(parsed.data.note ? { internalNotes: parsed.data.note } : {}),
  });

  if (next === 'in_progress') {
    await notify(
      booking.customerId,
      'testing_started',
      `Testing started on ${booking.reference}`,
      `Our testers are now playing ${booking.gameName}. We will publish your report when testing wraps up.`,
      `/dashboard/bookings/${booking.reference}`,
    );
  }
  if (next === 'completed') {
    await notify(
      booking.customerId,
      'testing_completed',
      `Testing completed for ${booking.reference}`,
      `Testing on ${booking.gameName} is complete. Your report will appear in your dashboard as soon as it is published.`,
      `/dashboard/bookings/${booking.reference}`,
    );
  }
  if (next === 'cancelled') {
    await notify(
      booking.customerId,
      'booking_cancelled',
      `Booking ${booking.reference} cancelled`,
      `Booking ${booking.reference} for ${booking.gameName} has been cancelled.`,
      `/dashboard/bookings/${booking.reference}`,
    );
  }
  revalidateAdminBooking(booking.reference);
}

export async function editBookingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await admin();
  if (!staff) return { error: 'Administrator access required.' };
  const parsed = bookingEditSchema.safeParse({
    bookingId: formData.get('bookingId'),
    gameName: formData.get('gameName'),
    gameUrl: formData.get('gameUrl'),
    platform: formData.get('platform'),
    requestedDate: formData.get('requestedDate'),
    requestedTime: formData.get('requestedTime'),
    contactName: formData.get('contactName'),
    contactEmail: formData.get('contactEmail'),
    contactPhone: formData.get('contactPhone') ?? '',
    internalNotes: formData.get('internalNotes') ?? '',
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const booking = await getBookingById(parsed.data.bookingId);
  if (!booking) return { error: 'Booking not found.' };

  await updateBooking(booking.id, {
    gameName: parsed.data.gameName,
    gameUrl: parsed.data.gameUrl,
    platform: parsed.data.platform,
    requestedDate: parsed.data.requestedDate,
    requestedTime: parsed.data.requestedTime,
    contactName: parsed.data.contactName,
    contactEmail: parsed.data.contactEmail,
    contactPhone: parsed.data.contactPhone || null,
    internalNotes: parsed.data.internalNotes || null,
  });
  revalidateAdminBooking(booking.reference);
  return { success: `Booking ${booking.reference} updated.` };
}

export async function saveBookingNotesAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await admin();
  if (!staff) return { error: 'Administrator access required.' };
  const bookingId = String(formData.get('bookingId') ?? '');
  const notes = String(formData.get('internalNotes') ?? '').slice(0, 2000);
  if (!bookingId) return { error: 'Booking not found.' };
  const booking = await getBookingById(bookingId);
  if (!booking) return { error: 'Booking not found.' };
  await updateBooking(bookingId, { internalNotes: notes || null });
  revalidateAdminBooking(booking.reference);
  return { success: 'Internal notes saved.' };
}

export async function assignTesterAction(formData: FormData): Promise<void> {
  const staff = await admin();
  if (!staff) return;
  const bookingId = String(formData.get('bookingId') ?? '');
  const testerId = String(formData.get('testerId') ?? '');
  if (!bookingId || !testerId) return;
  const booking = await getBookingById(bookingId);
  const tester = await getProfileById(testerId);
  if (!booking || !tester) return;
  await assignTester(bookingId, tester.id, tester.fullName, staff.id);
  revalidateAdminBooking(booking.reference);
}

export async function unassignTesterAction(formData: FormData): Promise<void> {
  const staff = await admin();
  if (!staff) return;
  const bookingId = String(formData.get('bookingId') ?? '');
  const testerId = String(formData.get('testerId') ?? '');
  if (!bookingId || !testerId) return;
  const booking = await getBookingById(bookingId);
  await unassignTester(bookingId, testerId);
  revalidateAdminBooking(booking?.reference ?? null);
}

/* -------------------------------------------------------------- payments */

export async function updatePaymentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await admin();
  if (!staff) return { error: 'Administrator access required.' };
  const parsed = paymentUpdateSchema.safeParse({
    bookingId: formData.get('bookingId'),
    status: formData.get('status'),
    paymentLink: formData.get('paymentLink') ?? '',
    paymentReference: formData.get('paymentReference') ?? '',
    adminNote: formData.get('adminNote') ?? '',
    refundReference: formData.get('refundReference') ?? '',
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const booking = await getBookingById(parsed.data.bookingId);
  if (!booking) return { error: 'Booking not found.' };

  const payment = await getPaymentByBookingId(booking.id);
  if (!payment) return { error: 'No payment record exists for this booking yet.' };

  await updatePayment(booking.id, {
    status: parsed.data.status,
    paymentLink: parsed.data.paymentLink || null,
    paymentReference: parsed.data.paymentReference || null,
    adminNote: parsed.data.adminNote || null,
    refundReference: parsed.data.refundReference || null,
    verifiedBy: parsed.data.status === 'paid' ? staff.id : null,
  });

  if (parsed.data.status === 'paid') {
    await notify(
      booking.customerId,
      'payment_verified',
      'Payment verified',
      `We have verified your payment for booking ${booking.reference}. Thank you!`,
      `/dashboard/bookings/${booking.reference}`,
    );
  }
  if (parsed.data.status === 'payment_requested') {
    await notify(
      booking.customerId,
      'payment_requested',
      'Payment requested',
      `Payment details for booking ${booking.reference} are ready. Amount: £${(booking.pricePence / 100).toFixed(2)}.`,
      `/dashboard/bookings/${booking.reference}`,
    );
  }
  if (parsed.data.status === 'refunded') {
    await notify(
      booking.customerId,
      'payment_refunded',
      'Refund issued',
      `A refund has been recorded for booking ${booking.reference}.`,
      `/dashboard/bookings/${booking.reference}`,
    );
  }
  revalidateAdminBooking(booking.reference);
  return { success: `Payment for ${booking.reference} updated.` };
}

/* --------------------------------------------------------------- reports */

export async function saveReportAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await admin();
  if (!staff) return { error: 'Administrator access required.' };
  const parsed = reportSchema.safeParse({
    bookingId: formData.get('bookingId'),
    gameName: formData.get('gameName'),
    testerName: formData.get('testerName'),
    platform: formData.get('platform'),
    testingDate: formData.get('testingDate'),
    overallImpression: formData.get('overallImpression'),
    gameplayExperience: formData.get('gameplayExperience'),
    gameMechanics: formData.get('gameMechanics'),
    bugsDiscovered: formData.get('bugsDiscovered'),
    performanceObservations: formData.get('performanceObservations'),
    userExperience: formData.get('userExperience'),
    suggestedImprovements: formData.get('suggestedImprovements'),
    additionalComments: formData.get('additionalComments') ?? '',
    overallRating: formData.get('overallRating'),
    intent: formData.get('intent') ?? 'draft',
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const booking = await getBookingById(parsed.data.bookingId);
  if (!booking) return { error: 'Booking not found.' };
  const publish = parsed.data.intent === 'publish';
  if (publish && booking.status !== 'completed' && booking.status !== 'in_progress') {
    return {
      error: 'Mark the booking as in progress or completed before publishing its report.',
    };
  }

  const report = await saveReport({
    bookingId: booking.id,
    customerId: booking.customerId,
    gameName: parsed.data.gameName,
    testerName: parsed.data.testerName,
    platform: parsed.data.platform,
    testingDate: parsed.data.testingDate,
    overallImpression: parsed.data.overallImpression,
    gameplayExperience: parsed.data.gameplayExperience,
    gameMechanics: parsed.data.gameMechanics,
    bugsDiscovered: parsed.data.bugsDiscovered,
    performanceObservations: parsed.data.performanceObservations,
    userExperience: parsed.data.userExperience,
    suggestedImprovements: parsed.data.suggestedImprovements,
    additionalComments: parsed.data.additionalComments || null,
    overallRating: parsed.data.overallRating,
    status: publish ? 'published' : 'draft',
    createdBy: staff.id,
  });

  if (publish) {
    await setReportStatus(report.id, 'published');
    await notify(
      booking.customerId,
      'report_published',
      `Report ready for ${booking.reference}`,
      `Your testing report for ${booking.gameName} has been published to your dashboard.`,
      `/dashboard/reports/${report.id}`,
    );
  }

  revalidatePath('/admin/reports');
  revalidatePath(`/admin/reports/${booking.reference}`);
  revalidatePath('/dashboard/reports');
  revalidatePath(`/dashboard/reports/${report.id}`);
  revalidatePath(`/dashboard/bookings/${booking.reference}`);
  revalidatePath('/dashboard/notifications');
  return {
    success: publish ? 'Report published and the customer notified.' : 'Draft saved.',
    data: { reportId: report.id },
  };
}

export async function publishReportAction(formData: FormData): Promise<void> {
  const staff = await admin();
  if (!staff) return;
  const reportId = String(formData.get('reportId') ?? '');
  if (!reportId) return;
  const updated = await setReportStatus(reportId, 'published');
  if (!updated) return;
  const booking = await getBookingById(updated.bookingId);
  if (booking) {
    await notify(
      booking.customerId,
      'report_published',
      `Report ready for ${booking.reference}`,
      `Your testing report for ${booking.gameName} has been published to your dashboard.`,
      `/dashboard/reports/${updated.id}`,
    );
    revalidatePath(`/dashboard/bookings/${booking.reference}`);
    revalidatePath(`/admin/bookings/${booking.reference}`);
  }
  revalidatePath('/admin/reports');
  revalidatePath('/dashboard/reports');
  revalidatePath(`/dashboard/reports/${reportId}`);
}

export async function unpublishReportAction(formData: FormData): Promise<void> {
  const staff = await admin();
  if (!staff) return;
  const reportId = String(formData.get('reportId') ?? '');
  if (!reportId) return;
  await setReportStatus(reportId, 'draft');
  revalidatePath('/admin/reports');
  revalidatePath('/dashboard/reports');
  revalidatePath(`/dashboard/reports/${reportId}`);
}

/* ---------------------------------------------------------------- reviews */

export async function moderateReviewAction(formData: FormData): Promise<void> {
  const staff = await admin();
  if (!staff) return;
  const reviewId = String(formData.get('reviewId') ?? '');
  const decision = String(formData.get('decision') ?? '');
  if (!reviewId || (decision !== 'approved' && decision !== 'rejected')) return;
  await moderateReview(reviewId, decision, staff.id);
  revalidatePath('/admin/reviews');
  revalidatePath('/');
  revalidatePath('/dashboard/reviews');
}

/* --------------------------------------------------------------- services */

export async function updateServiceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await admin();
  if (!staff) return { error: 'Administrator access required.' };
  const parsed = serviceSchema.safeParse({
    serviceId: formData.get('serviceId'),
    name: formData.get('name'),
    tagline: formData.get('tagline') ?? '',
    description: formData.get('description'),
    pricePence: Math.round(Number(formData.get('pricePence') ?? 0) * 100),
    durationMinutes: formData.get('durationMinutes'),
    active: formData.get('active') === 'on' || formData.get('active') === 'true',
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  await updateService(parsed.data.serviceId, {
    name: parsed.data.name,
    tagline: parsed.data.tagline || '',
    description: parsed.data.description,
    pricePence: parsed.data.pricePence,
    durationMinutes: parsed.data.durationMinutes,
    active: Boolean(parsed.data.active),
  });
  revalidatePath('/admin/services');
  revalidatePath('/services');
  revalidatePath('/');
  revalidatePath('/book');
  return { success: `${parsed.data.name} updated.` };
}

export async function toggleServiceActiveAction(formData: FormData): Promise<void> {
  const staff = await admin();
  if (!staff) return;
  const serviceId = String(formData.get('serviceId') ?? '');
  const nextActive = String(formData.get('nextActive') ?? '') === 'true';
  if (!serviceId) return;
  await updateService(serviceId, { active: nextActive });
  revalidatePath('/admin/services');
  revalidatePath('/services');
  revalidatePath('/');
  revalidatePath('/book');
}

/* ----------------------------------------------------------- availability */

export async function createSlotAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await admin();
  if (!staff) return { error: 'Administrator access required.' };
  const parsed = availabilitySchema.safeParse({
    date: formData.get('date'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    capacity: formData.get('capacity'),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  if (parsed.data.endTime <= parsed.data.startTime) {
    return { fieldErrors: { endTime: 'End time must be after the start time' } };
  }
  await createAvailabilitySlot(parsed.data);
  revalidatePath('/admin/availability');
  revalidatePath('/book');
  return { success: `Slot added for ${parsed.data.date} at ${parsed.data.startTime}.` };
}

export async function toggleSlotAction(formData: FormData): Promise<void> {
  const staff = await admin();
  if (!staff) return;
  const id = String(formData.get('slotId') ?? '');
  const isOpen = String(formData.get('isOpen') ?? '') === 'true';
  if (!id) return;
  await setSlotOpen(id, isOpen);
  revalidatePath('/admin/availability');
  revalidatePath('/book');
}

export async function deleteSlotAction(formData: FormData): Promise<void> {
  const staff = await admin();
  if (!staff) return;
  const id = String(formData.get('slotId') ?? '');
  if (!id) return;
  await deleteSlot(id);
  revalidatePath('/admin/availability');
  revalidatePath('/book');
}

/* ---------------------------------------------------------------- testers */

export async function createTesterAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await admin();
  if (!staff) return { error: 'Administrator access required.' };
  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (fullName.length < 2) return { fieldErrors: { fullName: 'Enter the tester name' } };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { fieldErrors: { email: 'Enter a valid email' } };
  if (password.length < 8) return { fieldErrors: { password: 'Use at least 8 characters' } };

  const { getProfileByEmail } = await import('@/lib/data/repos');
  const existing = await getProfileByEmail(email);
  if (existing) return { fieldErrors: { email: 'An account with this email already exists' } };

  await createTesterAccount({ email, fullName, password });
  revalidatePath('/admin/testers');
  revalidatePath('/admin/bookings');
  return { success: `Tester account created for ${email}.` };
}

export async function setTesterRoleAction(formData: FormData): Promise<void> {
  const staff = await admin();
  if (!staff) return;
  const profileId = String(formData.get('profileId') ?? '');
  const role = String(formData.get('role') ?? '');
  if (!profileId || (role !== 'tester' && role !== 'customer')) return;
  if (profileId === staff.id) return;
  await setProfileRole(profileId, role);
  revalidatePath('/admin/testers');
  revalidatePath('/admin/customers');
}

/* --------------------------------------------------------------- messages */

export async function setMessageStatusAction(formData: FormData): Promise<void> {
  const staff = await admin();
  if (!staff) return;
  const id = String(formData.get('messageId') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!id || (status !== 'new' && status !== 'read' && status !== 'handled')) return;
  await setContactMessageStatus(id, status);
  revalidatePath('/admin/messages');
  revalidatePath('/admin');
}

/** Used by client-side helper links (e.g. "open booking" from the reports list). */
export async function resolveBookingReferenceAction(formData: FormData): Promise<string | null> {
  const staff = await admin();
  if (!staff) return null;
  const reference = String(formData.get('reference') ?? '').trim().toUpperCase();
  if (!reference) return null;
  const booking = await getBookingByReference(reference);
  return booking?.id ?? null;
}
