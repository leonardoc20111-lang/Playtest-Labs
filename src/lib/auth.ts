import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, SESSION_TTL_DAYS } from '@/lib/config';
import { createSession, deleteSession, getSessionProfile } from '@/lib/data/repos';
import type { Profile } from '@/lib/types';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_TTL_DAYS * 86_400,
};

/** Reads the session cookie and resolves the signed-in profile. */
export const getCurrentUser = cache(async (): Promise<Profile | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await getSessionProfile(token);
  } catch {
    return null;
  }
});

export async function establishSession(userId: string): Promise<void> {
  const token = await createSession(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, cookieOptions);
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token).catch(() => undefined);
  store.delete(SESSION_COOKIE);
}

export async function requireUser(nextPath = '/dashboard'): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** Role checks always run on the server against the database, never the client. */
export async function requireAdmin(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=%2Fadmin');
  if (user.role !== 'admin') redirect('/dashboard?denied=admin');
  return user;
}

export function isAdmin(user: Profile | null): boolean {
  return user?.role === 'admin';
}
