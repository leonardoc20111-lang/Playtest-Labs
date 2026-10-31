'use server';

import { revalidatePath } from 'next/cache';
import { contactSchema, fieldErrors } from '@/lib/validation';
import { createContactMessage, notifyAdmins } from '@/lib/data/repos';
import type { FormState } from '@/lib/form-state';

export async function contactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  await createContactMessage(parsed.data);
  await notifyAdmins({
    type: 'contact_message',
    title: `New enquiry from ${parsed.data.name}`,
    body: parsed.data.subject,
    link: '/admin/messages',
  });

  revalidatePath('/admin/messages');
  return { success: 'Thanks — your message has been sent. We reply to most enquiries within one working day.' };
}
