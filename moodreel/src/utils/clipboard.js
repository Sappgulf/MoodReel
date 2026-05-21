export function encodeSharePayload(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);

  if (typeof TextEncoder === 'undefined') {
    // Legacy fallback for very old environments
    return btoa(unescape(encodeURIComponent(text)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  const utf8 = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < utf8.length; i++) {
    binary += String.fromCharCode(utf8[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function normalizeBase64String(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const remainder = base64.length % 4;
  if (remainder === 0) return base64;
  if (remainder === 2) return `${base64}==`;
  if (remainder === 3) return `${base64}=`;
  return base64;
}

export function decodeSharePayload(value) {
  if (typeof value !== 'string') {
    throw new Error('Share payload must be a base64 string.');
  }

  const normalized = normalizeBase64String(value);
  const binary = atob(normalized);

  if (typeof TextDecoder === 'undefined') {
    return JSON.parse(decodeURIComponent(escape(binary)));
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const utf8 = new TextDecoder().decode(bytes);
  return JSON.parse(utf8);
}

export async function copyToClipboard(text) {
  if (typeof navigator === 'undefined' || typeof document === 'undefined') {
    throw new Error('Clipboard API unavailable in this environment.');
  }

  const fallbackText = typeof text === 'string' ? text : String(text);

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(fallbackText);
      return true;
    } catch (error) {
      // Fall through to legacy fallback for restricted contexts.
      console.warn('Clipboard.writeText unavailable:', error);
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = fallbackText;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-10000px';
  textarea.style.left = '-10000px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let copied = false;
  if (typeof document.execCommand === 'function') {
    copied = document.execCommand('copy');
  }

  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error('Copy command rejected');
  }

  return true;
}
