import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * 開発サーバーでも /api/extract を動かすためのプラグイン。
 * 本番では Vercel の Serverless Function として同じ実装が動く。
 */
function devApi() {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/extract', async (req, res) => {
        try {
          const { default: handler } = await server.ssrLoadModule('/api/extract.js')
          await handler(req, {
            status(code) {
              res.statusCode = code
              return this
            },
            json(body) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify(body))
            },
          })
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ok: false, error: String(error) }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), devApi()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
