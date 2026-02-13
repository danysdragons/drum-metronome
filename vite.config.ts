import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const githubRepository = process.env.GITHUB_REPOSITORY;
const repositoryName = githubRepository?.split('/')[1];
const githubPagesBase = repositoryName ? `/${repositoryName}/` : '/';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? githubPagesBase : '/',
  plugins: [react()],
  server: {
    port: 8080,
    strictPort: true
  }
});
