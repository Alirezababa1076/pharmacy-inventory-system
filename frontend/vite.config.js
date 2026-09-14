import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    allowedHosts: true, // اجازه دادن به تمام دامنه‌ها و تونل‌ها مثل loca.lt
    proxy: {
      '/api': 'http://localhost:5000' // هدایت خودکار درخواست‌ها به بک‌اند
    }
  }
})