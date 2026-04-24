/** @type {import('tailwindcss').Config} */
export default {
  safelist: [
    { pattern: /^avatar-effect-/ },
    { pattern: /^comment-effect-/ },
    { pattern: /^nametag-effect-/ }
  ],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-dark': '#050507',
        'neon-purple': '#a855f7',
        'neon-blue': '#3b82f6',
        'cyber-blue': '#06b6d4',
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
    },
  },
  plugins: [],
}
