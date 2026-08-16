import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  test: {
  environment: "jsdom",
  setupFiles: "./src/test/setup.ts",
  globals: false,
  clearMocks: true,

  coverage: {
    provider: "v8",
    reporter: ["text", "html", "lcov"],

    thresholds: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
})
