const env = (key: string) => (process.env[key] ?? '').trim();

export type BackendMode = 'supabase' | 'local';

/** Supabase project the platform is designed to run against (EU West / London). */
export const SUPABASE_PROJECT_ID = env('SUPABASE_PROJECT_ID') || 'yeotvkovscgtmsfdwsqv';

export const SUPABASE_URL = env('SUPABASE_URL') || env('NEXT_PUBLIC_SUPABASE_URL');
export const SUPABASE_ANON_KEY = env('SUPABASE_ANON_KEY') || env('NEXT_PUBLIC_SUPABASE_ANON_KEY');
export const SUPABASE_DB_URL = env('SUPABASE_DB_URL') || env('SUPABASE_DATABASE_URL');
/** Server-only key. Never imported into a client component. */
export const SUPABASE_SERVICE_ROLE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');

const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_DB_URL);

/**
 * Supabase is used when auth + data connection details are present. Otherwise the
 * platform runs on the bundled SQLite store so every workflow stays functional.
 * The application code is identical in both modes — only the driver changes.
 */
export const BACKEND_MODE: BackendMode = supabaseReady ? 'supabase' : 'local';

export const APP_URL = (env('APP_URL') || env('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000').replace(/\/$/, '');
export const DATA_DIR = env('DATA_DIR') || './data';
export const DATABASE_PATH = env('DATABASE_PATH') || `${DATA_DIR}/playtest.db`;

export const ADMIN_EMAIL = (env('ADMIN_EMAIL') || 'admin@playtestlabs.gg').toLowerCase();
export const ADMIN_PASSWORD = env('ADMIN_PASSWORD');
export const ADMIN_NAME = env('ADMIN_NAME') || 'Playtest Labs Admin';
export const DEMO_PASSWORD = env('DEMO_PASSWORD');

export const SESSION_COOKIE = 'ptl_session';
export const SESSION_TTL_DAYS = 30;
export const SUPPORT_EMAIL = env('SUPPORT_EMAIL') || 'hello@playtestlabs.gg';

export const PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Mobile', 'Roblox'] as const;

export const BOOKING_STATUSES = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'] as const;
export const PAYMENT_STATUSES = ['unpaid', 'payment_requested', 'awaiting_verification', 'paid', 'refunded'] as const;
