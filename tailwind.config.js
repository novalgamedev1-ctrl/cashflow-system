/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'accent': '#FFA500',
        'accent-light': '#FFB84D',
        'dark-primary': '#0F1419',
        'dark-secondary': '#1A1F2E',
        'dark-tertiary': '#252D3D',
        'glass-border': 'rgba(255, 165, 0, 0.2)',
      },
      fontFamily: {
        'display': ['Sora', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-in',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { 
            opacity: '1',
            textShadow: '0 0 20px rgba(255, 165, 0, 0.5)',
          },
          '50%': { 
            opacity: '0.8',
            textShadow: '0 0 30px rgba(255, 165, 0, 0.8)',
          },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { 
            opacity: '0',
            transform: 'translateY(10px)',
          },
          to: { 
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
    },
  },
  plugins: [],
}