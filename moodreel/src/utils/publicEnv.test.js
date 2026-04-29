import { describe, it, expect } from 'vitest';
import { resolvePublicEnv } from './publicEnv';

describe('resolvePublicEnv', () => {
  it('returns undefined when keys are missing or empty', () => {
    expect(resolvePublicEnv()).toBeUndefined();
    expect(resolvePublicEnv([])).toBeUndefined();
  });

  it('returns first matching value from injected sources', () => {
    expect(
      resolvePublicEnv(['A', 'B'], {
        vite: { A: '', B: 'from-vite' },
        node: { B: 'from-node' },
      })
    ).toBe('from-vite');
  });

  it('falls through to node when vite values are empty', () => {
    expect(
      resolvePublicEnv(['X'], {
        vite: { X: '' },
        node: { X: 'from-node' },
      })
    ).toBe('from-node');
  });
});
