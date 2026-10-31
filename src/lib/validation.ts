import { z } from 'zod';
import { BOOKING_STATUSES, PAYMENT_STATUSES, PLATFORMS } from '@/lib/config';

const email = z.string().trim().min(3, 'Enter your email address').email('Enter a valid email address');
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(200, 'Password is too long');

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name').max(120),
    email,
    company: z.string().trim().max(120).optional().or(z.literal('')),
    password,
    confirmPassword: z.string(),
    marketingOptIn: z.coerce.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, 'Reset link is invalid'),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(120),
  company: z.string().trim().max(120).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  displayName: z.string().trim().max(60).optional().or(z.literal('')),
  marketingOptIn: z.coerce.boolean().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const bookingSchema = z.object({
  serviceId: z.string().min(1, 'Choose a service'),
  gameName: z.string().trim().min(2, 'Enter your game name').max(120),
  gameUrl: z
    .string()
    .trim()
    .min(4, 'Enter a link to your game')
    .max(500)
    .refine((value) => /^https?:\/\/.+\..+/i.test(value), 'Enter a valid URL starting with http:// or https://'),
  platform: z.enum(PLATFORMS, { errorMap: () => ({ message: 'Choose a testing platform' }) }),
  gameDescription: z.string().trim().min(20, 'Tell us about your game (at least 20 characters)').max(2000),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a testing date'),
  requestedTime: z.string().regex(/^\d{2}:\d{2}$/, 'Choose a testing time'),
  contactName: z.string().trim().min(2, 'Enter a contact name').max(120),
  contactEmail: email,
  contactPhone: z.string().trim().max(40).optional().or(z.literal('')),
  additionalInstructions: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(120),
  email,
  subject: z.string().trim().min(3, 'Enter a subject').max(160),
  message: z.string().trim().min(10, 'Tell us a little more').max(2000),
});

export const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.coerce.number().int().min(1, 'Choose a rating').max(5),
  comment: z.string().trim().min(10, 'Please write at least 10 characters').max(1000),
  displayName: z.string().trim().max(60).optional().or(z.literal('')),
});

export const reportSchema = z.object({
  bookingId: z.string().min(1),
  gameName: z.string().trim().min(1, 'Game name is required').max(120),
  testerName: z.string().trim().min(1, 'Tester name is required').max(120),
  platform: z.enum(PLATFORMS),
  testingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose the testing date'),
  overallImpression: z.string().trim().min(10, 'Add an overall impression').max(4000),
  gameplayExperience: z.string().trim().min(10, 'Describe the gameplay experience').max(4000),
  gameMechanics: z.string().trim().min(10, 'Describe the game mechanics').max(4000),
  bugsDiscovered: z.string().trim().min(1, 'List the bugs discovered (or "None found")').max(4000),
  performanceObservations: z.string().trim().min(10, 'Add performance observations').max(4000),
  userExperience: z.string().trim().min(10, 'Add user experience notes').max(4000),
  suggestedImprovements: z.string().trim().min(10, 'Add suggested improvements').max(4000),
  additionalComments: z.string().trim().max(2000).optional().or(z.literal('')),
  overallRating: z.coerce.number().int().min(0, 'Rate out of 10').max(10, 'Rate out of 10'),
  intent: z.enum(['draft', 'publish']),
});

export const bookingStatusSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum(BOOKING_STATUSES),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});

export const paymentUpdateSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum(PAYMENT_STATUSES),
  paymentLink: z.string().trim().max(500).optional().or(z.literal('')),
  paymentReference: z.string().trim().max(120).optional().or(z.literal('')),
  adminNote: z.string().trim().max(500).optional().or(z.literal('')),
  refundReference: z.string().trim().max(120).optional().or(z.literal('')),
});

export const customerPaymentSchema = z.object({
  bookingId: z.string().min(1),
  paymentReference: z.string().trim().min(2, 'Add the payment reference from Revolut').max(120),
  customerNote: z.string().trim().max(500).optional().or(z.literal('')),
});

export const availabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Choose a start time'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Choose an end time'),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1').max(20),
});

export const serviceSchema = z.object({
  serviceId: z.string().min(1),
  name: z.string().trim().min(2, 'Enter a service name').max(120),
  tagline: z.string().trim().max(160).optional().or(z.literal('')),
  description: z.string().trim().min(10, 'Add a description').max(2000),
  pricePence: z.coerce.number().int().min(0, 'Price cannot be negative').max(100_000),
  durationMinutes: z.coerce.number().int().min(5, 'Minimum 5 minutes').max(600),
  active: z.coerce.boolean().optional(),
});

export const bookingEditSchema = z.object({
  bookingId: z.string().min(1),
  gameName: z.string().trim().min(2).max(120),
  gameUrl: z.string().trim().min(4).max(500),
  platform: z.enum(PLATFORMS),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  requestedTime: z.string().regex(/^\d{2}:\d{2}$/),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: email,
  contactPhone: z.string().trim().max(40).optional().or(z.literal('')),
  internalNotes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type FieldErrors = Record<string, string>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
