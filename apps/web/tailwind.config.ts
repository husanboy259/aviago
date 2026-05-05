import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e6fff9',
          100: '#b3ffe9',
          200: '#66ffd3',
          300: '#00f5b8',
          400: '#00d4a0',
          500: '#00B887',  // Airo Go — mint green
          600: '#009970',
          700: '#007a5a',
          800: '#005c43',
          900: '#003d2c',
        },
        dark: {
          DEFAULT: '#0D0D0D',
          100: '#1a1a1a',
          200: '#2a2a2a',
          300: '#3a3a3a',
        },
        amber: {
          400: '#FBBF24',
          500: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'pulse-ring': {
          '0%':   { transform: 'scale(0.95)', opacity: '0.8' },
          '70%':  { transform: 'scale(1.1)',  opacity: '0'   },
          '100%': { transform: 'scale(0.95)', opacity: '0'   },
        },
        drone: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'drone-hover': 'drone 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
