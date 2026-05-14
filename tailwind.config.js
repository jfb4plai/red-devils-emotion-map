import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    `${__dirname}/index.html`,
    `${__dirname}/src/**/*.{js,jsx}`,
  ],
  theme: {
    extend: {
      colors: {
        diable: {
          red:  '#CC0000',
          dark: '#1A1A1A',
          gold: '#FFD700',
          gray: '#2A2A2A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
