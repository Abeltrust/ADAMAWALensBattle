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
    },
    closeBundle() {
      const distAssets = resolve(__dirname, 'dist/assets')
      if (!existsSync(distAssets)) mkdirSync(distAssets, { recursive: true })

      const srcImages = resolve(__dirname, 'assets/images')
      const distImages = resolve(distAssets, 'images')
      if (existsSync(srcImages)) cpSync(srcImages, distImages, { recursive: true })

      const srcCsv = resolve(__dirname, 'assets/contestants.csv')
      const distCsv = resolve(distAssets, 'contestants.csv')
      if (existsSync(srcCsv)) cpSync(srcCsv, distCsv)
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
