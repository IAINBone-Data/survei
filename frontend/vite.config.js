import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // PENTING: base harus sama persis dengan nama repository GitHub Anda
  base: "/survei/", 
})