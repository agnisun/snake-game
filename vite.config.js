import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
    resolve: {
        alias: [
          { find: '@game', replacement: path.resolve(import.meta.dirname, 'src/game') },
          { find: '@utils', replacement: path.resolve(import.meta.dirname, 'src/utils') },
          { find: '@screens', replacement: path.resolve(import.meta.dirname, 'src/screens') },
        ],
    },
})