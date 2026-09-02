/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Space Grotesk"', 'sans-serif']
      },
      colors: {
        hacker: {
          bg: '#04060a',
          card: '#0a0e17',
          surface: '#101522',
          border: '#1a2337',
          borderHover: '#2a3b5c',
          green: '#00ff88',
          greenDim: '#00ff8820',
          cyan: '#00f0ff',
          amber: '#ffb700',
          red: '#ff3366'
        }
      },
      animation: {
        'scanline': 'scanline 8s linear infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flicker': 'flicker 0.15s infinite'
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.4 }
        }
      }
    },
  },
  plugins: [],
}
