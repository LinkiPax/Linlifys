import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist'  // ✅ Important for Vercel
  }
})
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import fs from 'fs'

// // export config as a function to access `mode`
// export default defineConfig(({ mode }) => ({
//   plugins: [react()],
//   define: {
//     global: 'window',
//   },
//   server: {
//     host: '0.0.0.0',
//     port: 5173,
//     https: mode === 'production'
//       ? {
//           key: fs.readFileSync('localhost+1-key.pem'),
//           cert: fs.readFileSync('localhost+1.pem'),
//         }
//       : false,
//   },
//   build: {
//     outDir: 'dist',
//   },
// }))
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import fs from 'fs'
// import path from 'path'
// import { fileURLToPath } from 'url'

// // Convert ESM URL to file path
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

// export default defineConfig(({ mode }) => ({
//   plugins: [react()],
//   define: {
//     global: 'window',
//   },
//   server: {
//     host: '0.0.0.0',
//     port: 5173,
//     https: {
//       key: fs.readFileSync(path.resolve(__dirname, 'localhost+1-key.pem')),
//       cert: fs.readFileSync(path.resolve(__dirname, 'localhost+1.pem')),
//     },
//   },
//   build: {
//     outDir: 'dist',
//   },
// }))
