/**
 * Read public client env vars in both Vite (import.meta.env) and CRA/node (process.env).
 * Use for optional keys like push VAPID — never put secrets-only values in the client bundle.
 */

const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env || {} : {};
const nodeEnv = typeof globalThis.process !== 'undefined' ? globalThis.process.env || {} : {};

/**
 * Resolve the first matching public env var (Vite or Node/process).
 * Prefer `vite` / `node` overrides only in tests; production callers pass keys only.
 */
export function resolvePublicEnv(keys, sources) {
  if (!keys?.length) return undefined;
  const vite = sources?.vite ?? viteEnv;
  const node = sources?.node ?? nodeEnv;
  for (const key of keys) {
    if (vite[key] !== undefined && vite[key] !== '') return vite[key];
    if (node[key] !== undefined && node[key] !== '') return node[key];
  }
  return undefined;
}
