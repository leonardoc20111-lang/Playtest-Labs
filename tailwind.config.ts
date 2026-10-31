import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05050A',
          900: '#08080F',
          850: '#0B0B14',
          800: '#101019',
          750: '#15151F',
          700: '#1B1B27',
          600: '#252533',
        },
        brand: {
          blue: '#4F7CFF',
          indigo: '#6A5BFF',
          violet: '#8B5CF6',
          cyan: '#38E1FF',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(106,91,255,0.25), 0 20px 60px -20px rgba(79,124,255,0.45)',
        card: '0 20px 50px -30px rgba(0,0,0,0.9)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(120deg, #4F7CFF 0%, #6A5BFF 45%, #8B5CF6 100%)',
        'mesh': 'radial-gradient(60% 60% at 15% 10%, rgba(79,124,255,0.18) 0%, transparent 60%), radial-gradient(50% 50% at 85% 0%, rgba(139,92,246,0.20) 0%, transparent 60%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.25)', opacity: '0' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'pulse-ring': 'pulseRing 2.4s cubic-bezier(0.22,1,0.36,1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
