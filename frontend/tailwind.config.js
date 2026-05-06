/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        secondary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
        },
        accent: {
          50: '#FDF2F8',
          100: '#FCE7F3',
          500: '#EC4899',
          600: '#DB2777',
          700: '#BE185D',
        },
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        toss: {
          bg: '#F2F4F6',
          white: '#FFFFFF',
          primary: '#3B82F6',
          text: '#191F28',
          'text-secondary': '#8B95A1',
          border: '#E5E7EB',
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'md-soft': '0 12px 48px rgba(59, 130, 246, 0.15)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.4)',
      },
    },
  },
  plugins: [],
}
