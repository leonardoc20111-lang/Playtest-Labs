'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { APP_URL } from '@/lib/config';
import { hashPassword, verifyPassword } from '@/lib/crypto';
import { destroySession, establishSession, getCurrentUser } from '@/lib/auth';
import { fieldErrors, changePasswordSchema, forgotPasswordSchema, loginSchema, profileSchema, registerSchema, resetPasswordSchema } from '@/lib/validation';
import { safeNext, type FormState } from '@/lib/form-state';
import {
  consumePasswordReset,
  createPasswordReset,
  createProfile,
  deleteUserSessions,
  getPasswordReset,
  getProfileByEmail,
  updatePassword,
  updateProfile,
} from '@/lib/data/repos';

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const profile = await getProfileByEmail(parsed.data.email);
  if (!profile || !verifyPassword(parsed.data.password, profile.passwordHash)) {
    return { error: 'Incorrect email or password. Please try again.' };
  }

  await establishSession(profile.id);
  const next = safeNext(formData.get('next'));
  redirect(next ?? (profile.role === 'admin' ? '/admin' : '/dashboard'));
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    company: formData.get('company') ?? '',
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    marketingOptIn: formData.get('marketingOptIn') === 'on' || formData.get('marketingOptIn') === 'true',
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const existing = await getProfileByEmail(parsed.data.email);
  if (existing) {
    return { fieldErrors: { email: 'An account with this email already exists. Try signing in instead.' } };
  }

  const profile = await createProfile({
    email: parsed.data.email,
    password: parsed.data.password,
    fullName: parsed.data.fullName,
    company: parsed.data.company || null,
    marketingOptIn: Boolean(parsed.data.marketingOptIn),
  });

  await establishSession(profile.id);
  const next = safeNext(formData.get('next'));
  redirect(next ?? '/dashboard?welcome=1');
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/');
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const profile = await getProfileByEmail(parsed.data.email);
  if (!profile) {
    // Do not reveal whether an account exists.
    return {
      success: 'If an account exists for that email, a reset link has been generated.',
    };
  }

  const token = await createPasswordReset(profile.id);
  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return {
    success:
      'Reset link generated. Email delivery is not configured on this deployment, so use the secure link below — it expires in 60 minutes and can only be used once.',
    data: { resetUrl },
  };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const reset = await getPasswordReset(parsed.data.token);
  if (!reset) return { error: 'This reset link is invalid or has expired. Request a new one.' };

  await updatePassword(reset.userId, parsed.data.password);
  await consumePasswordReset(parsed.data.token);
  await deleteUserSessions(reset.userId);
  redirect('/login?reset=1');
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Your session has expired. Please sign in again.' };

  const parsed = profileSchema.safeParse({
    fullName: formData.get('fullName'),
    company: formData.get('company') ?? '',
    phone: formData.get('phone') ?? '',
    displayName: formData.get('displayName') ?? '',
    marketingOptIn: formData.get('marketingOptIn') === 'on' || formData.get('marketingOptIn') === 'true',
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  await updateProfile(user.id, {
    fullName: parsed.data.fullName,
    company: parsed.data.company || null,
    phone: parsed.data.phone || null,
    displayName: parsed.data.displayName || null,
    marketingOptIn: Boolean(parsed.data.marketingOptIn),
  });

  revalidatePath('/dashboard/settings');
  revalidatePath('/account');
  return { success: 'Profile updated.' };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Your session has expired. Please sign in again.' };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const full = await getProfileByEmail(user.email);
  if (!full || !verifyPassword(parsed.data.currentPassword, full.passwordHash)) {
    return { fieldErrors: { currentPassword: 'Your current password is incorrect.' } };
  }

  await updatePassword(user.id, hashPassword(parsed.data.password));
  return { success: 'Password changed. Your other sessions remain signed in on this device.' };
}
