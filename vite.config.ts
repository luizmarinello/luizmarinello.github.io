import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages: se o repositorio NAO se chamar <usuario>.github.io,
// troque base para '/nome-do-repo/'.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
})
