import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requestUrl } from 'obsidian';
import { BloggerApiClient } from './blogger-client';
import { isMissingPostResult } from './post-status';
import { PostStatus } from '../../core/types';
import { OAuth2Client } from '../oauth2/client';
import { BloggerProfile } from '../profile';

const profile = (): BloggerProfile => ({
  name: 'test',
  endpoint: 'https://test.blogspot.com',
  blogId: 'B',
  googleOAuth2Token: {
    accessToken: 'a',
    tokenType: 'Bearer',
    expiresIn: 3600,
    expiresAt: Date.now() + 3_600_000,
    refreshToken: 'r',
    scope: 's',
  },
  isDefault: true,
});

const client = (): BloggerApiClient =>
  new BloggerApiClient({
    profile: profile(),
    oauth2: new OAuth2Client({ clientId: 'i', clientSecret: 's' }),
    onTokenRefreshed: async () => {},
  });

const mocked = requestUrl as unknown as {
  mockReset: () => void;
  mockResolvedValue: (v: unknown) => void;
  mockResolvedValueOnce: (v: unknown) => void;
  mock: { calls: unknown[][] };
};

describe('BloggerApiClient', () => {
  beforeEach(() => mocked.mockReset());

  it('inserts with isDraft and returns the post id', async () => {
    mocked.mockResolvedValue({ status: 200, json: { id: 'P1', url: 'u', status: 'DRAFT' } });
    const r = await client().publish('T', '<p>x</p>', {
      status: PostStatus.Draft,
      labels: [],
      title: 'T',
      content: '<p>x</p>',
    });
    expect(r.code).toBe('OK');
    const call = mocked.mock.calls[0][0] as { url: string };
    expect(call.url).toContain('/B/posts?isDraft=true');
  });

  it('updates an existing post with PUT and switches status', async () => {
    mocked.mockResolvedValueOnce({ status: 200, json: { id: 'P1', url: 'u', status: 'DRAFT' } });
    mocked.mockResolvedValueOnce({ status: 200, json: { status: 'LIVE' } });
    const r = await client().publish('T', '<p>x</p>', {
      status: PostStatus.Live,
      labels: [],
      title: 'T',
      content: '<p>x</p>',
      postId: 'P1',
    });
    expect(r.code).toBe('OK');
    const first = mocked.mock.calls[0][0] as { url: string; method: string };
    expect(first.url).toContain('/B/posts/P1');
    expect(first.method).toBe('PUT');
    const second = mocked.mock.calls[1][0] as { url: string };
    expect(second.url).toContain('/B/posts/P1/publish');
  });

  it('reports a missing post so the caller can recreate it', async () => {
    mocked.mockResolvedValueOnce({ status: 404, json: { error: { code: 404, message: 'not found' } } });
    const r = await client().publish('T', '<p>x</p>', {
      status: PostStatus.Live,
      labels: [],
      title: 'T',
      content: '<p>x</p>',
      postId: 'P1',
    });
    expect(r.code).toBe('Error');
    expect(isMissingPostResult(r)).toBe(true);
  });
});
