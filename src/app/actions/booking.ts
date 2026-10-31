'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { fieldErrors, bookingSchema, customerPaymentSchema, reviewSchema } from '@/lib/validation';
import {
  createBooking,
  createNotification,
  createReview,
  getBookingById,
  getBookingByReference,
  getPaymentByBookingId,
  getReviewByBookingId,
  getServiceById,
  isSlotAvailable,
  notifyAdmins,
  updateBooking,
  updatePayment,
} from '@/lib/data/repos';
import type { FormState } from '@/lib/form-state';

export async function createBookingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=%2Fbook');
  if (user.role === 'admin') {
    return { error: 'Administrator accounts cannot create bookings. Use a customer account to book a playtest.' };
  }

  const parsed = bookingSchema.safeParse({
    serviceId: formData.get('serviceId'),
    gameName: formData.get('gameName'),
    gameUrl: formData.get('gameUrl'),
    platform: formData.get('platform'),
    gameDescription: formData.get('gameDescription'),
    requestedDate: formData.get('requestedDate'),
    requestedTime: formData.get('requestedTime'),
    contactName: formData.get('contactName'),
    contactEmail: formData.get('contactEmail'),
    contactPhone: formData.get('contactPhone') ?? '',
    additionalInstructions: formData.get('additionalInstructions') ?? '',
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const service = await getServiceById(parsed.data.serviceId);
  if (!service || !service.active) {
    return { fieldErrors: { serviceId: 'That service is no longer available. Pick another package.' } };
  }

  const slotOpen = await isSlotAvailable(parsed.data.requestedDate, parsed.data.requestedTime);
  if (!slotOpen) {
    return {
      fieldErrors: {
        requestedTime: 'That slot is already full. Choose a different date or time.',
      },
    };
  }

  const result = await createBooking(
    {
      customerId: user.id,
      serviceId: service.id,
      gameName: parsed.data.gameName,
      gameUrl: parsed.data.gameUrl,
      platform: parsed.data.platform,
      gameDescription: parsed.data.gameDescription,
      requestedDate: parsed.data.requestedDate,
      requestedTime: parsed.data.requestedTime,
      contactName: parsed.data.contactName,
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone || null,
      additionalInstructions: parsed.data.additionalInstructions || null,
    },
    service.pricePence,
  );

  if (!result.ok) return { error: result.error };

  await notifyAdmins({
    type: 'booking_created',
    title: `New booking ${result.booking.reference}`,
    body: `${user.fullName} requested ${service.name} for ${result.booking.gameName}.`,
    link: `/admin/bookings/${result.booking.id}`,
  });

  revalidatePath('/dashboard');
  revalidatePath('/admin');
  redirect(`/dashboard/bookings/${result.booking.reference}?created=1`);
}

export async function cancelBookingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Your session has expired. Please sign in again.' };

  const bookingId = String(formData.get('bookingId') ?? '');
  const booking = await getBookingById(bookingId);
  if (!booking) return { error: 'Booking not found.' };
  if (booking.customerId !== user.id) return { error: 'You can only cancel your own bookings.' };
  if (booking.status === 'completed' || booking.status === 'cancelled') {
    return { error: `This booking is already ${booking.status} and cannot be cancelled.` };
  }

  const reason = String(formData.get('reason') ?? '').trim();
  await updateBooking(booking.id, {
    status: 'cancelled',
    cancelledReason: reason || 'Cancelled by customer',
  });
  await notifyAdmins({
    type: 'booking_cancelled',
    title: `Booking ${booking.reference} cancelled`,
    body: `${user.fullName} cancelled their booking.`,
    link: `/admin/bookings/${booking.id}`,
  });

  revalidatePath(`/dashboard/bookings/${booking.reference}`);
  revalidatePath('/dashboard');
  revalidatePath('/admin/bookings');
  return { success: 'Booking cancelled. If you already paid, our team will contact you about a refund.' };
}

export async function submitReportedPaymentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Your session has expired. Please sign in again.' };

  const parsed = customerPaymentSchema.safeParse({
    bookingId: formData.get('bookingId'),
    paymentReference: formData.get('paymentReference'),
    customerNote: formData.get('customerNote') ?? '',
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const booking = await getBookingById(parsed.data.bookingId);
  if (!booking || booking.customerId !== user.id) return { error: 'Booking not found.' };

  const payment = await getPaymentByBookingId(booking.id);
  if (!payment) return { error: 'Payment record not found for this booking.' };
  if (payment.status === 'paid') return { error: 'This booking is already marked as paid.' };
  if (payment.status === 'refunded') return { error: 'This payment has been refunded.' };
  if (!payment.paymentLink) {
    return { error: 'A payment request has not been issued yet. Please wait until your booking is accepted.' };
  }

  await updatePayment(booking.id, {
    paymentReference: parsed.data.paymentReference,
    customerNote: parsed.data.customerNote || null,
    // Reported by the customer only — an admin still has to verify it.
    status: 'awaiting_verification',
  });
  await notifyAdmins({
    type: 'payment_reported',
    title: `Payment reference added for ${booking.reference}`,
    body: `${user.fullName} submitted reference ${parsed.data.paymentReference}. Verify it in payments.`,
    link: '/admin/payments',
  });

  revalidatePath(`/dashboard/bookings/${booking.reference}`);
  revalidatePath('/dashboard/payments');
  revalidatePath('/admin/payments');
  return {
    success:
      'Reference submitted. Our team will verify the Revolut payment manually — the booking is not marked as paid until that check is complete.',
  };
}

export async function submitReviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Your session has expired. Please sign in again.' };

  const parsed = reviewSchema.safeParse({
    bookingId: formData.get('bookingId'),
    rating: formData.get('rating'),
    comment: formData.get('comment'),
    displayName: formData.get('displayName') ?? '',
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const booking = await getBookingById(parsed.data.bookingId);
  if (!booking || booking.customerId !== user.id) return { error: 'Booking not found.' };
  if (booking.status !== 'completed') {
    return { error: 'You can review a playtest once the booking has been completed.' };
  }
  const existing = await getReviewByBookingId(booking.id);
  if (existing) return { error: 'You have already submitted a review for this booking.' };

  await createReview({
    bookingId: booking.id,
    customerId: user.id,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    displayName: parsed.data.displayName || user.fullName,
  });
  await notifyAdmins({
    type: 'review_submitted',
    title: `New review for ${booking.reference}`,
    body: `${user.fullName} left a ${parsed.data.rating}-star review. Moderate it in reviews.`,
    link: '/admin/reviews',
  });

  revalidatePath(`/dashboard/bookings/${booking.reference}`);
  revalidatePath('/dashboard/reviews');
  revalidatePath('/admin/reviews');
  return { success: 'Thanks for the review — it will appear publicly once our team approves it.' };
}

/** Re-validates a booking reference for a customer (used by the detail page guard). */
export async function assertBookingOwnership(reference: string, customerId: string) {
  const booking = await getBookingByReference(reference);
  if (!booking || booking.customerId !== customerId) return null;
  return booking;
}

/** Customer-facing notification acknowledgement. */
export async function notifyCustomerOfBooking(customerId: string, title: string, body: string, link?: string) {
  await createNotification({ userId: customerId, type: 'booking_update', title, body, link: link ?? null });
}
