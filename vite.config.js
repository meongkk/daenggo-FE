import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // 개발 중 /api로 시작하는 요청을 백엔드 서버로 전달합니다.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // 백엔드가 /uploads/... 형태로 돌려준 사진 주소도 8080 서버에서 읽습니다.
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
