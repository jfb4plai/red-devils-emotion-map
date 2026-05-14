import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');

export default {
  plugins: {
    tailwindcss: { config: `${__dirname}/tailwind.config.js` },
    autoprefixer: {},
  },
};
