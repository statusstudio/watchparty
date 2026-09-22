import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

let gitCommit = process.env.RENDER_GIT_COMMIT || '';
if (!gitCommit) {
  try {
    gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
  } catch (e) {
    gitCommit = 'latest';
  }
} else {
  gitCommit = gitCommit.slice(0, 7);
}

const buildTime = new Date().toISOString();

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_BUILD_TIME__: JSON.stringify(buildTime),
    __APP_COMMIT_HASH__: JSON.stringify(gitCommit),
  },
  server: {
    port: 3000,
    strictPort: true,
  },
});

