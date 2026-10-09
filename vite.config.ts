import crypto from 'node:crypto';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Polyfill crypto.hash for Node.js < 20.12 compatibility
if (typeof (crypto as unknown as { hash?: unknown }).hash !== 'function') {
  (crypto as unknown as { hash: (algo: string, data: unknown, outputEncoding?: crypto.BinaryToTextEncoding) => string | Buffer }).hash = function (algo, data, outputEncoding) {
    const h = crypto.createHash(algo).update(data as string | NodeJS.ArrayBufferView);
    return outputEncoding ? h.digest(outputEncoding) : h.digest();
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
});

