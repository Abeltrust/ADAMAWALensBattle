import { defineConfig } from 'vite'
import { resolve } from 'path'
import { cpSync, existsSync, mkdirSync, symlinkSync, rmSync } from 'fs'

function copyAssets() {
  return {
    name: 'copy-assets',
    buildStart() {
      // During dev: create a symlink from public/assets -> assets (for /assets/ URL path)
      const publicAssets = resolve(__dirname, 'public/assets')
      const srcAssets = resolve(__dirname, 'assets')
      if (!existsSync(publicAssets)) {
        try {
          symlinkSync(srcAssets, publicAssets, 'junction')
        } catch (e) {
          // fallback: copy
          mkdirSync(publicAssets, { recursive: true })
          if (existsSync(srcAssets)) cpSync(srcAssets, publicAssets, { recursive: true })
        }
      }

      // During dev: copy root contestants.csv into public/ so it's served at /contestants.csv
      const rootCsv = resolve(__dirname, 'contestants.csv')
      const publicCsv = resolve(__dirname, 'public/contestants.csv')
      if (existsSync(rootCsv)) cpSync(rootCsv, publicCsv)
    },
    closeBundle() {
      const distAssets = resolve(__dirname, 'dist/assets')
      if (!existsSync(distAssets)) mkdirSync(distAssets, { recursive: true })

      const srcImages = resolve(__dirname, 'assets/images')
      const distImages = resolve(distAssets, 'images')
      if (existsSync(srcImages)) cpSync(srcImages, distImages, { recursive: true })

      // Copy root contestants.csv into dist/ for production
      const rootCsv = resolve(__dirname, 'contestants.csv')
      const distCsv = resolve(__dirname, 'dist/contestants.csv')
      if (existsSync(rootCsv)) cpSync(rootCsv, distCsv)
    },
  }
}

export default defineConfig({
  plugins: [copyAssets()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        contestants: resolve(__dirname, 'contestants.html'),
        results: resolve(__dirname, 'results.html'),
        about: resolve(__dirname, 'about.html'),
      },
    },
  },
})
