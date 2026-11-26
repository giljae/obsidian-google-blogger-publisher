import { describe, it, expect } from 'vitest';
import { isMissingPostResult, statusChangeAction } from './post-status';
import { PostStatus } from '../../core/types';
import { BloggerClientReturnCode } from './types';

describe('post-status', () => {
  it('flags SOFT_TRASHED and 404 as missing', () => {
    expect(
      isMissingPostResult({
        code: 'OK',
        data: { postId: '1', url: '', status: PostStatus.SoftTrashed },
      }),
    ).toBe(true);
    expect(
      isMissingPostResult({ code: 'Error', message: 'x', response: { error: { code: 404 } } }),
    ).toBe(true);
    expect(
      isMissingPostResult({
        code: BloggerClientReturnCode.Error,
        message: 'x',
        response: {},
      }),
    ).toBe(false);
  });

  it('decides publish/revert/none', () => {
    expect(statusChangeAction(PostStatus.Live, PostStatus.Draft)).toBe('publish');
    expect(statusChangeAction(PostStatus.Draft, PostStatus.Live)).toBe('revert');
    expect(statusChangeAction(PostStatus.Live, PostStatus.Live)).toBe('none');
  });
});
