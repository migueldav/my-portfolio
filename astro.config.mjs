import { defineConfig } from 'astro/config';

import vercel from '@astrojs/vercel';

export default defineConfig({
  vite: {
    server: {
      host: true,
      allowedHosts: ['despairful-roxanne-profitably.ngrok-free.dev', '.ngrok-free.dev']
    }
  },

  devToolbar: {
    enabled: false
  },

  adapter: vercel()
});