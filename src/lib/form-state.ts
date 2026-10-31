export interface FormState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
  /** Optional value surfaced back to the user (e.g. a generated reset link). */
  data?: Record<string, string>;
}

export const emptyFormState: FormState = {};

/** Only allow same-origin relative redirects after sign-in. */
export function safeNext(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  return trimmed;
}
