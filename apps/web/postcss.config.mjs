import { fileURLToPath } from 'node:url';

const config = {
  plugins: {
    // Explicit path so Tailwind finds its config even when Next is started from the repo root.
    tailwindcss: { config: fileURLToPath(new URL('./tailwind.config.ts', import.meta.url)) },
    autoprefixer: {},
  },
};

export default config;
