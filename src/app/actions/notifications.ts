'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { markAllNotificationsRead, markNotificationRead } from '@/lib/data/repos';

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await markNotificationRead(id, user.id);
  revalidatePath('/dashboard/notifications');
  revalidatePath('/dashboard');
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await markAllNotificationsRead(user.id);
  revalidatePath('/dashboard/notifications');
  revalidatePath('/dashboard');
}
