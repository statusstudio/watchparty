/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f0f13",
        surface: "#151722",
        "surface-card": "#1a1d2d",
        "surface-light": "#23273c",
        accent: {
          pink: "#ec4899",
          purple: "#8b5cf6",
          cyan: "#06b6d4",
          emerald: "#10b981",
        }
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
