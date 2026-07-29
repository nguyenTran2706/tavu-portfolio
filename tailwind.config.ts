import type { Config } from 'tailwindcss';

/**
 * Tokens mirror design-system/MASTER.md § 2. The chart colours (`accent`,
 * `series2`, `ramp.*`) are validator output — see MASTER.md § 3 before editing.
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        void: '#0b0a09',
        page: '#100f0d',
        card: '#191713',
        raised: '#211e19',
        hairline: 'rgba(255,252,240,0.10)',
        grid: '#2c2a25',
        axis: '#3a3730',
        ink: {
          DEFAULT: '#f7f4ec',
          secondary: '#c5bfb1',
          muted: '#8f887a',
        },
        accent: {
          DEFAULT: '#c98500',
          hover: '#e0a03c',
        },
        series2: '#3987e5',
        ramp: {
          1: '#7a5206',
          2: '#9c6a08',
          3: '#b87c0a',
          4: '#d09220',
          5: '#e3af57',
          6: '#f2cf95',
        },
        status: {
          good: '#0ca30c',
          warning: '#fab219',
          serious: '#ec835a',
          critical: '#d03b3b',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        hero: ['clamp(3rem, 11vw, 8.5rem)', { lineHeight: '0.92', letterSpacing: '-0.03em' }],
        h2: ['clamp(2rem, 5vw, 3.5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        eyebrow: ['0.75rem', { lineHeight: '1', letterSpacing: '0.16em' }],
      },
      maxWidth: { shell: '1240px' },
      borderRadius: { card: '16px', tile: '12px' },
      transitionTimingFunction: { out: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'scroll-cue': {
          '0%,100%': { transform: 'translateY(0)', opacity: '0.35' },
          '50%': { transform: 'translateY(6px)', opacity: '1' },
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        'scroll-cue': 'scroll-cue 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
