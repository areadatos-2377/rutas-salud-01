import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 5173 es el default de Vite, pero en esta maquina ya lo ocupa otro
    // proyecto (Menu_Portafolio_Trabajo_IMB, con --strictPort). Fijamos un
    // puerto propio y strictPort para que un choque futuro falle ruidoso
    // (error claro) en vez de arrancar en silencio en otro puerto distinto
    // al que el backend tiene permitido en CORS.
    port: 5183,
    strictPort: true,
  },
})
