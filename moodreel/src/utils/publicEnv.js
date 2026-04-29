/**
 * Read public client env vars in both Vite (import.meta.env) and CRA/node (process.env).
 * Use for optional keys like push VAPID — never put secrets-only values in the client bundle.
 */

const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env || {} : {};
const nodeEnv = typeof globalThis.process !== 'undefined' ? globalThis.process.env || {} : {};

export function resolvePublicEnv(keys) {
  if (!keys?.length) return undefined;
  for (const key of keys) {
    if (viteEnv[key] !== undefined && viteEnv[key] !== '') return viteEnv[key];
    if (nodeEnv[key] !== undefined && nodeEnv[key] !== '') return nodeEnv[key];
  }
  return undefined;
}
