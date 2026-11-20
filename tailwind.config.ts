import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#673AB8', dark: '#552f99', light: '#f2eef9', mid: '#d7c9ef', ink: '#43267a' },
        ink: '#1e1b2e',
      },
      borderRadius: { xl: '10px', '2xl': '16px' },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config;
