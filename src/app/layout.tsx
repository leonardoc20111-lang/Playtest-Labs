import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  title: {
    default: 'Playtest Labs — Your Game. Our Testing. Better Experiences.',
    template: '%s · Playtest Labs',
  },
  description:
    'Professional game testing and QA for Roblox, PC, PlayStation, Xbox and mobile. Structured playtest reports, bug identification and actionable improvement feedback from real testers.',
  keywords: ['game testing', 'playtest', 'QA', 'Roblox testing', 'game QA', 'bug reports', 'playtest labs'],
  openGraph: {
    title: 'Playtest Labs — Your Game. Our Testing. Better Experiences.',
    description:
      'Structured playtests with detailed written reports covering gameplay, mechanics, bugs, performance and user experience.',
    type: 'website',
    siteName: 'Playtest Labs',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#05050A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-indigo focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
