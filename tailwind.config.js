/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-dark': '#070511',
        'primary-purple': '#6D3DF5',
        'neon-purple': '#a855f7',
        'neon-blue': '#3b82f6',
        'cyber-blue': '#06b6d4',
        'light-glow': '#C084FC',
        'card-navy': '#1A1038',
        'light-bg': '#F8F5FF',
        'light-card': '#FFFFFF',
        'glass': 'rgba(255,255,255,0.05)',
      },
      boxShadow: {
        'neon-purple': '0 0 20px rgba(168,85,247,0.5), 0 0 60px rgba(168,85,247,0.2)',
        'neon-blue': '0 0 20px rgba(59,130,246,0.5), 0 0 60px rgba(59,130,246,0.2)',
      },
      backgroundImage: {
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(168,85,247,0.3), transparent)',
        'card-glow': 'radial-gradient(ellipse at top, rgba(168,85,247,0.15), transparent 70%)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-slide': {
          '0%': { transform: 'translateX(100vw)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        'marquee': 'marquee 40s linear infinite',
        'marquee-slide': 'marquee-slide 15s linear infinite',
      }
    },
  },
  plugins: [],
}
