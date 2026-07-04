import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        destructive: 'hsl(var(--destructive))',
      },
      boxShadow: {
        panel: '0 1px 2px rgba(15, 23, 42, 0.08)',
        'enterprise-panel': 'var(--shadow-panel)',
        'enterprise-dialog': 'var(--shadow-dialog)',
      },
      fontFamily: {
        sans: ['var(--font-enterprise)'],
        mono: ['var(--font-mono-enterprise)'],
      },
      fontSize: {
        'display-xl': ['var(--text-display-xl)', { lineHeight: 'var(--leading-heading)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-tight)' }],
        'display-l': ['var(--text-display-l)', { lineHeight: 'var(--leading-heading)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-tight)' }],
        'display-m': ['var(--text-display-m)', { lineHeight: 'var(--leading-heading)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-tight)' }],
        h1: ['var(--text-h1)', { lineHeight: 'var(--leading-heading)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-tight)' }],
        h2: ['var(--text-h2)', { lineHeight: 'var(--leading-heading)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-tight)' }],
        h3: ['var(--text-h3)', { lineHeight: 'var(--leading-heading)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-tight)' }],
        h4: ['var(--text-h4)', { lineHeight: 'var(--leading-heading)', fontWeight: 'var(--weight-semibold)' }],
        h5: ['var(--text-h5)', { lineHeight: 'var(--leading-heading)', fontWeight: 'var(--weight-semibold)' }],
        'body-lg': ['var(--text-body-lg)', { lineHeight: 'var(--leading-body)', fontWeight: 'var(--weight-regular)' }],
        body: ['var(--text-body)', { lineHeight: 'var(--leading-body)', fontWeight: 'var(--weight-regular)' }],
        'body-sm': ['var(--text-body-sm)', { lineHeight: 'var(--leading-body)', fontWeight: 'var(--weight-regular)' }],
        caption: ['var(--text-caption)', { lineHeight: 'var(--leading-dense)', fontWeight: 'var(--weight-regular)' }],
        micro: ['var(--text-micro)', { lineHeight: 'var(--leading-dense)', fontWeight: 'var(--weight-regular)' }],
      },
      spacing: {
        'token-1': 'var(--space-1)',
        'token-2': 'var(--space-2)',
        'token-3': 'var(--space-3)',
        'token-4': 'var(--space-4)',
        'token-5': 'var(--space-5)',
        'token-6': 'var(--space-6)',
        'token-8': 'var(--space-8)',
        'token-10': 'var(--space-10)',
        'token-12': 'var(--space-12)',
      },
      borderRadius: {
        'enterprise-sm': 'var(--radius-sm)',
        'enterprise-md': 'var(--radius-md)',
        'enterprise-lg': 'var(--radius-lg)',
        'enterprise-xl': 'var(--radius-xl)',
        'enterprise-2xl': 'var(--radius-2xl)',
        'enterprise-pill': 'var(--radius-pill)',
      },
      transitionTimingFunction: {
        enterprise: 'ease-in-out',
      },
      zIndex: {
        sticky: 'var(--z-sticky)',
        overlay: 'var(--z-overlay)',
        modal: 'var(--z-modal)',
      },
    },
  },
  plugins: [],
};

export default config;
