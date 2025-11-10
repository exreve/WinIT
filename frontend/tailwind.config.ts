import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#0a0e27',
        ocean: '#1e3a5f',
        sand: '#f4f3e8',
        sky: '#38bdf8',
        teal: '#14b8a6',
      },
      boxShadow: {
        glow: '0 0 20px rgba(20, 184, 166, 0.5)',
      },
      fontFamily: {
        mono: ['Fira Code', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config

