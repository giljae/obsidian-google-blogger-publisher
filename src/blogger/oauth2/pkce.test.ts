import { describe, it, expect } from 'vitest';
import { generateCodeVerifier, codeChallengeS256 } from './pkce';

describe('pkce', () => {
  it('makes a url-safe verifier', () => {
    const v = generateCodeVerifier();
    expect(v).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(v.length).toBeGreaterThan(20);
  });

  it('derives a stable S256 challenge', async () => {
    expect(await codeChallengeS256('abc')).toBe(await codeChallengeS256('abc'));
    expect(await codeChallengeS256('abc')).not.toBe('abc');
  });
});
