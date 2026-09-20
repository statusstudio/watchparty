/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        notion: {
          primary: "#0075de",
          "primary-active": "#005bab",
          secondary: "#213183",
          canvas: "#ffffff",
          "canvas-soft": "#f6f5f4",
          surface: "#ffffff",
          ink: "#000000",
          "ink-secondary": "#31302e",
          "ink-muted": "#615d59",
          "ink-faint": "#a39e98",
          hairline: "#e6e6e6",
          sky: "#62aef0",
          purple: "#d6b6f6",
          "purple-deep": "#391c57",
          pink: "#ff64c8",
          orange: "#dd5b00",
          teal: "#2a9d99",
          green: "#1aae39",
          brown: "#523410",
        },
        background: "#f6f5f4",
        surface: "#ffffff",
        "surface-card": "#ffffff",
        "surface-light": "#f6f5f4",
        accent: {
          pink: "#ff64c8",
          purple: "#d6b6f6",
          cyan: "#62aef0",
          emerald: "#1aae39",
        }
      },
      boxShadow: {
        'notion-soft': '0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)',
        'notion-elevated': '0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)',
        'notion-modal': '0 12px 32px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 1.5s infinite',
        'ripple': 'ripple 1.2s cubic-bezier(0, 0.2, 0.8, 1) infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(16, 185, 129, 0.6), 0 0 30px rgba(16, 185, 129, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(16, 185, 129, 0.9), 0 0 50px rgba(16, 185, 129, 0.5)' },
        },
        ripple: {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(1.35)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
