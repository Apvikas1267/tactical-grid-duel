/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          dark: '#0a0d14',
          card: '#111726',
          border: '#1e293b',
          accent: '#38bdf8',
          p1: '#3b82f6',
          p2: '#ef4444',
          ap: '#f59e0b',
          hp: '#10b981'
        }
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)' },
          '50%': { boxShadow: '0 0 25px rgba(56, 189, 248, 0.8)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' }
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.4s ease-in-out'
      }
    },
  },
  plugins: [],
}
