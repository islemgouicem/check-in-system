import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,          // allows Vite to listen on all network interfaces
    allowedHosts: ['pearle-barbed-afton.ngrok-free.dev'], // allows ngrok (or any host) for dev
  },
})
