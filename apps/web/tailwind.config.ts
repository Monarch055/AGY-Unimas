import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rekasains: {
          navy: '#0B132B',
          slate: '#1C2541',
          teal: '#00E5FF',
          emerald: '#10B981',
          amber: '#F59E0B',
          crimson: '#EF4444',
        },
      },
    },
  },
  plugins: [],
};

export default config;
