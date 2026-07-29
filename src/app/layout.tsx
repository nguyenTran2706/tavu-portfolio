import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { identity, contact } from '@/content/profile';

const display = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${identity.name} — ${identity.title}`,
  description: identity.valueProp,
  openGraph: {
    title: `${identity.name} — ${identity.title}`,
    description: identity.valueProp,
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport = { themeColor: '#100f0d' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `no-js` is stripped by SmoothScroll on mount; until then CSS keeps every
    // reveal visible, so the page is readable with JS disabled or still loading.
    <html lang="en-AU" className={`no-js ${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]
                     focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:font-mono
                     focus:text-sm focus:text-void"
        >
          Skip to content
        </a>
        {children}
        <noscript>
          <p className="shell py-4 text-center font-mono text-sm text-ink-muted">
            This page works without JavaScript — the 3D backdrop and dashboard filters are
            simply inactive. Contact details are at the bottom, or email{' '}
            <a className="link-underline" href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
            .
          </p>
        </noscript>
      </body>
    </html>
  );
}
