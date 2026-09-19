import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-songs-directly',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/songs/')) {
            // Lấy tên file bỏ qua query param
            const fileName = req.url.split('?')[0].replace('/songs/', '');
            const rootFile = path.join(__dirname, 'songs', fileName);
            const publicFile = path.join(__dirname, 'public', 'songs', fileName);

            // Ưu tiên đọc file mới nhất từ thư mục songs hoặc public/songs
            const fileToServe = fs.existsSync(rootFile) ? rootFile : (fs.existsSync(publicFile) ? publicFile : null);

            if (fileToServe) {
              // Chống browser cache để luôn phát bản mp3 mới nhất
              res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
              res.setHeader('Pragma', 'no-cache');
              res.setHeader('Expires', '0');
              res.setHeader('Content-Type', 'audio/mpeg');

              const stat = fs.statSync(fileToServe);
              res.setHeader('Content-Length', stat.size);

              const stream = fs.createReadStream(fileToServe);
              return stream.pipe(res);
            }
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 3000,
    open: true
  }
});
