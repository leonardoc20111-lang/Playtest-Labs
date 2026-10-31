/**
 * Playtest Labs end-to-end regression suite.
 *
 * Boots the production Next.js server against a throwaway SQLite database, then drives
 * the real UI with Chromium through the full customer and administrator journeys.
 *
 *   node scripts/e2e.mjs
 *
 * Exits non-zero on the first failed assertion.
 */
import { spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = Number(process.env.E2E_PORT || 3407);
const BASE = `http://127.0.0.1:${PORT}`;
const DB_PATH = `/tmp/playtest-e2e-${Date.now()}.db`;

const PLAYWRIGHT_CANDIDATES = [
  process.env.PLAYWRIGHT_MODULE,
  '/opt/appjet/browser/node_modules/playwright/index.js',
  'playwright',
].filter(Boolean);

let passed = 0;
const failures = [];

function ok(label) {
  passed += 1;
  console.log(`  \u2713 ${label}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function step(label, fn) {
  try {
    await fn();
    ok(label);
  } catch (error) {
    failures.push({ label, error });
    console.error(`  \u2717 ${label}\n      ${error.message}`);
    throw error;
  }
}

async function loadPlaywright() {
  let lastError;
  for (const candidate of PLAYWRIGHT_CANDIDATES) {
    try {
      const mod = await import(candidate);
      return mod.chromium ?? mod.default?.chromium;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Playwright is unavailable (${lastError?.message ?? 'no candidate resolved'})`);
}

function startServer() {
  const child = spawn('node_modules/.bin/next', ['start', '-p', String(PORT), '-H', '127.0.0.1'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DATABASE_PATH: DB_PATH,
      BACKEND_MODE: 'local',
      APP_URL: BASE,
      ADMIN_EMAIL: 'admin@playtestlabs.gg',
      ADMIN_PASSWORD: 'Playtest-Admin-Dev1!',
      DEMO_PASSWORD: 'PlaytestDemo123!',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const log = [];
  child.stdout.on('data', (chunk) => log.push(String(chunk)));
  child.stderr.on('data', (chunk) => log.push(String(chunk)));
  child.on('exit', (code) => log.push(`\n[server exited with code ${code}]`));
  return { child, log };
}

async function waitForHealth(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE}/api/health`);
      if (response.ok) {
        const body = await response.json();
        if (body.status === 'ok') return body;
      }
    } catch {
      /* server not listening yet */
    }
    await sleep(400);
  }
  throw new Error('Server did not become healthy within the timeout');
}

async function waitForText(page, text, timeout = 20_000) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout });
}

async function signOut(page) {
  await page.getByRole('button', { name: 'Sign out' }).first().click();
  await page.waitForURL((url) => !url.pathname.startsWith('/dashboard'), { timeout: 20_000 });
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 25_000 });
}

async function register(page, { fullName, email, password }) {
  await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded' });
  await page.fill('#fullName', fullName);
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.fill('#confirmPassword', password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 25_000 });
}

const REPORT_SECTIONS = [
  ['#overallImpression', 'Neon Drift Racers is a confident arcade racer with a tight core loop.'],
  ['#gameplayExperience', 'The first three races teach drifting quickly and the pacing stays brisk.'],
  ['#gameMechanics', 'Boost timing and drift chaining feel rewarding; upgrade costs climb steeply.'],
  ['#bugsDiscovered', 'Reproduced once: the leaderboard froze after a disconnect on lap 3.'],
  ['#performanceObservations', '60fps on mid-range hardware; the shop screen loads assets slowly.'],
  ['#userExperience', 'Onboarding is clear, though the HUD text is small on mobile.'],
  ['#suggestedImprovements', 'Add a tutorial replay and persist the selected car between sessions.'],
];

async function main() {
  const chromium = await loadPlaywright();
  const { child, log } = startServer();
  let browser;
  try {
    const health = await waitForHealth();
    console.log(`\nServer healthy on ${BASE} (backend: ${health.backend}/${health.dialect})\n`);

    browser = await chromium.launch({ headless: true });
    const stamp = Date.now();
    const customerEmail = `e2e.customer.${stamp}@playtestlabs.gg`;
    const otherEmail = `e2e.other.${stamp}@playtestlabs.gg`;
    const password = 'PlaytestE2E123!';
    const gameName = `Neon Drift Racers ${stamp}`;

    const customerCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const otherCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    const customer = await customerCtx.newPage();
    const other = await otherCtx.newPage();
    const admin = await adminCtx.newPage();

    const consoleErrors = [];
    for (const page of [customer, other, admin]) {
      page.on('pageerror', (error) => consoleErrors.push(error.message));
    }

    console.log('Public site');
    await step('home page renders the brand tagline and pricing', async () => {
      await customer.goto(BASE, { waitUntil: 'domcontentloaded' });
      await waitForText(customer, 'Your Game. Our Testing. Better Experiences.');
      await waitForText(customer, 'Standard Playtest');
    });

    await step('services, how it works and contact pages render', async () => {
      for (const [path, expected] of [
        ['/services', '\u00a37'],
        ['/how-it-works', 'How it works'],
        ['/contact', 'Contact'],
      ]) {
        const response = await customer.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
        assert(response?.status() === 200, `${path} returned ${response?.status()}`);
        await waitForText(customer, expected);
      }
    });

    await step('protected dashboard redirects anonymous visitors', async () => {
      await customer.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
      await customer.waitForURL(/\/login/, { timeout: 15_000 });
    });

    console.log('\nCustomer journey');
    await step('registration creates an account and lands on the dashboard', async () => {
      await register(customer, { fullName: 'E2E Tester One', email: customerEmail, password });
      await waitForText(customer, 'Welcome');
    });

    await step('profile settings update persists', async () => {
      await customer.goto(`${BASE}/dashboard/settings`, { waitUntil: 'domcontentloaded' });
      const nameField = customer.locator('input[name="fullName"]').first();
      await nameField.fill('E2E Tester Renamed');
      await customer.getByRole('button', { name: /Save/i }).first().click();
      await waitForText(customer, 'saved', 20_000);
      await customer.goto(`${BASE}/dashboard/settings`, { waitUntil: 'domcontentloaded' });
      assert(
        (await customer.locator('input[name="fullName"]').first().inputValue()) === 'E2E Tester Renamed',
        'full name did not persist',
      );
    });

    let reference = '';
    await step('booking submission creates a unique reference', async () => {
      await customer.goto(`${BASE}/book`, { waitUntil: 'domcontentloaded' });
      await customer.locator('input[name="serviceId"]').first().check({ force: true });
      await customer.fill('#gameName', gameName);
      await customer.fill('#gameUrl', 'https://www.roblox.com/games/123456789/Neon-Drift');
      await customer.selectOption('#platform', 'Roblox');
      await customer.fill(
        '#gameDescription',
        'Arcade drift racer with three circuits, upgrade shop and online leaderboards.',
      );
      const instructions = customer.locator('textarea[name="additionalInstructions"]');
      if (await instructions.count()) {
        await instructions.first().fill('Focus on drift handling and the upgrade economy.');
      }
      await customer.getByRole('button', { name: /Submit booking request/i }).click();
      await customer.waitForURL(/\/dashboard\/bookings\/PL-[A-Z0-9]+/, { timeout: 30_000 });
      reference = customer.url().split('/').pop().split('?')[0];
      assert(/^PL-[A-Z0-9]{4,}$/.test(reference), `unexpected reference ${reference}`);
      await waitForText(customer, reference);
      await waitForText(customer, 'Pending');
    });

    await step('customer dashboard lists the new booking and notification', async () => {
      await customer.goto(`${BASE}/dashboard/bookings`, { waitUntil: 'domcontentloaded' });
      await waitForText(customer, reference);
      await customer.goto(`${BASE}/dashboard/notifications`, { waitUntil: 'domcontentloaded' });
      await waitForText(customer, 'Neon Drift Racers');
    });

    await step('customer cannot reach the admin area', async () => {
      const response = await customer.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
      const path = new URL(customer.url()).pathname;
      assert(
        !path.startsWith('/admin') || response?.status() === 403,
        `customer reached ${path} (status ${response?.status()})`,
      );
    });

    await step('sign out clears the session', async () => {
      await customer.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
      await signOut(customer);
      await customer.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
      await customer.waitForURL(/\/login/, { timeout: 15_000 });
    });

    console.log('\nAdministrator journey');
    await step('admin signs in and reaches the overview', async () => {
      await login(admin, 'admin@playtestlabs.gg', 'Playtest-Admin-Dev1!');
      await admin.waitForURL(/\/admin$/, { timeout: 20_000 });
      await waitForText(admin, 'Recent activity');
    });

    await step('admin accepts the booking and requests payment', async () => {
      await admin.goto(`${BASE}/admin/bookings/${reference}`, { waitUntil: 'domcontentloaded' });
      await admin.getByRole('button', { name: /Accept/i }).click();
      await waitForText(admin, 'Accepted', 25_000);
    });

    await step('admin verifies the Revolut payment manually', async () => {
      await admin.goto(`${BASE}/admin/payments`, { waitUntil: 'domcontentloaded' });
      const card = admin
        .locator('div')
        .filter({ has: admin.locator('form select[name="status"]') })
        .filter({ hasText: reference })
        .last();
      await card.waitFor({ state: 'visible', timeout: 15_000 });
      const status = card.locator('select[name="status"]');
      if (!(await status.inputValue())) throw new Error('payment status control missing');
      await status.selectOption('paid');
      const refInput = card.locator('input[name="paymentReference"]');
      await refInput.fill('REV-E2E-4242');
      await card.getByRole('button', { name: /Update payment/i }).click();
      await waitForText(admin, 'updated', 25_000);
    });

    await step('report saves as a draft and stays hidden from the customer', async () => {
      await admin.goto(`${BASE}/admin/reports/${reference}`, { waitUntil: 'domcontentloaded' });
      for (const [selector, value] of REPORT_SECTIONS) {
        await admin.fill(selector, value);
      }
      await admin.fill('#overallRating', '8');
      await admin.getByRole('button', { name: /Save draft/i }).click();
      await waitForText(admin, 'Draft saved', 25_000);

      await login(customer, customerEmail, password);
      await customer.goto(`${BASE}/dashboard/reports`, { waitUntil: 'domcontentloaded' });
      await sleep(500);
      const body = await customer.locator('body').innerText();
      assert(!body.includes(gameName), 'draft report was visible to the customer');
    });

    let reportUrl = '';
    await step('publishing the report notifies the customer', async () => {
      await admin.reload({ waitUntil: 'domcontentloaded' });
      await admin.goto(`${BASE}/admin/reports/${reference}`, { waitUntil: 'domcontentloaded' });
      await admin.getByRole('button', { name: /Publish report/i }).click();
      await waitForText(admin, 'Report published', 25_000);

      await customer.goto(`${BASE}/dashboard/reports`, { waitUntil: 'domcontentloaded' });
      const link = customer.locator('a[href^="/dashboard/reports/"]').filter({ hasText: gameName }).first();
      await link.waitFor({ state: 'visible', timeout: 20_000 });
      reportUrl = await link.getAttribute('href');
      await link.click();
      await customer.waitForURL(/\/dashboard\/reports\//, { timeout: 20_000 });
      await waitForText(customer, 'Overall impression');
      await waitForText(customer, '8/10');
    });

    await step('customer sees the verified payment', async () => {
      await customer.goto(`${BASE}/dashboard/payments`, { waitUntil: 'domcontentloaded' });
      await waitForText(customer, 'Paid');
      await waitForText(customer, 'REV-E2E-4242');
    });

    console.log('\nReviews');
    await step('completed booking accepts a moderated review', async () => {
      await admin.goto(`${BASE}/admin/bookings/${reference}`, { waitUntil: 'domcontentloaded' });
      const statusForm = admin.locator('form').filter({ has: admin.locator('select[name="status"]') }).first();
      await statusForm.locator('select[name="status"]').selectOption('completed');
      await statusForm.getByRole('button', { name: /Update/i }).click();
      await waitForText(admin, 'updated', 25_000);

      await customer.goto(`${BASE}/dashboard/reviews`, { waitUntil: 'domcontentloaded' });
      const reviewForm = customer.locator('form').filter({ has: customer.locator('textarea[name="comment"]') }).first();
      await reviewForm.waitFor({ state: 'visible', timeout: 20_000 });
      await reviewForm.getByRole('button', { name: '4 stars' }).click();
      await reviewForm.locator('textarea[name="comment"]').fill('Clear, actionable report with real bug repro steps.');
      const displayName = reviewForm.locator('input[name="displayName"]');
      if (await displayName.count()) await displayName.fill('E2E Tester');
      await reviewForm.getByRole('button', { name: /Submit review/i }).click();
      await waitForText(customer, 'moderation', 20_000);
    });

    await step('admin approves the review for public display', async () => {
      await admin.goto(`${BASE}/admin/reviews`, { waitUntil: 'domcontentloaded' });
      const reviewCard = admin.locator('div').filter({ hasText: 'Clear, actionable report' }).last();
      await reviewCard.getByRole('button', { name: 'Approve' }).click();
      await waitForText(admin, 'approved', 25_000);
    });

    console.log('\nAuthorisation boundaries');
    await step("a second customer cannot open another customer's booking", async () => {
      await register(other, { fullName: 'E2E Tester Two', email: otherEmail, password });
      const response = await other.goto(`${BASE}/dashboard/bookings/${reference}`, {
        waitUntil: 'domcontentloaded',
      });
      const body = await other.locator('body').innerText();
      const blocked = response?.status() === 404 || /not found|could not be found/i.test(body);
      assert(blocked, `other customer saw the booking (status ${response?.status()})`);
    });

    await step("a second customer cannot open another customer's report", async () => {
      const response = await other.goto(`${BASE}${reportUrl}`, { waitUntil: 'domcontentloaded' });
      const body = await other.locator('body').innerText();
      assert(
        response?.status() === 404 || /not found|could not be found/i.test(body),
        'other customer saw a private report',
      );
    });

    console.log('\nResponsive layout');
    await step('mobile viewport renders and the menu opens', async () => {
      const mobileCtx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      });
      const mobile = await mobileCtx.newPage();
      await mobile.goto(BASE, { waitUntil: 'domcontentloaded' });
      await waitForText(mobile, 'Your Game. Our Testing. Better Experiences.');
      const menu = mobile.getByRole('button', { name: 'Open menu' });
      await menu.waitFor({ state: 'visible', timeout: 15_000 });
      await menu.click();
      await mobile.getByRole('link', { name: /Services/i }).first().waitFor({ state: 'visible', timeout: 15_000 });
      const overflow = await mobile.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      assert(overflow <= 2, `horizontal overflow of ${overflow}px at 390px width`);
      await mobileCtx.close();
    });

    await step('no uncaught browser errors during the run', async () => {
      assert(consoleErrors.length === 0, `page errors: ${consoleErrors.join(' | ')}`);
    });

    console.log(`\n${passed} checks passed, 0 failed\n`);
    return 0;
  } catch (error) {
    console.error(`\n${passed} passed, ${failures.length || 1} failed`);
    console.error(`\n${error.stack || error.message}`);
    const tail = log.join('').split('\n').slice(-25).join('\n');
    if (tail.trim()) console.error(`\n--- server log (tail) ---\n${tail}`);
    return 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    child.kill('SIGTERM');
    await sleep(500);
    if (!child.killed) child.kill('SIGKILL');
    if (existsSync(DB_PATH)) rmSync(DB_PATH, { force: true });
  }
}

main().then((code) => process.exit(code));
