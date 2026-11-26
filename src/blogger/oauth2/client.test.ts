import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requestUrl } from 'obsidian';
import { OAuth2Client } from './client';
import { InternalOAuth2Token } from './token';

const token = (overrides: Partial<InternalOAuth2Token> = {}): InternalOAuth2Token => ({
  accessToken: 't',
  tokenType: 'Bearer',
  expiresIn: 3600,
  expiresAt: Date.now() + 3600_000,
  refreshToken: 'r',
  scope: 's',
  ...overrides,
});

describe('OAuth2Client', () => {
  beforeEach(() => {
    (requestUrl as unknown as { mockReset: () => void }).mockReset();
  });

  it('returns a still-fresh token unchanged (no network call)', async () => {
    const client = new OAuth2Client({ clientId: 'a', clientSecret: 'b' });
    const fresh = token();
    expect(await client.ensureFresh(fresh)).toBe(fresh);
    expect(requestUrl).not.toHaveBeenCalled();
  });

  it('refreshes an expired token', async () => {
    const client = new OAuth2Client({ clientId: 'a', clientSecret: 'b' });
    (requestUrl as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      status: 200,
      json: {
        access_token: 'new',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'r2',
        scope: 's',
      },
    });
    const fresh = await client.ensureFresh(token({ expiresAt: 0 }));
    expect(fresh.accessToken).toBe('new');
    expect(requestUrl).toHaveBeenCalledTimes(1);
  });
});
