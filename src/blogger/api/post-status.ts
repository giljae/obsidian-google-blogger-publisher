import { PostStatus } from '../../core/types';
import { BloggerClientResult, BloggerClientReturnCode, BloggerPublishResult } from './types';

/**
 * True when an update targeted a post that no longer exists — because it is in
 * the trash (the API answers with `SOFT_TRASHED`) or was permanently deleted
 * (the API answers with HTTP 404). The caller should then create a new post.
 */
export function isMissingPostResult(result: BloggerClientResult<BloggerPublishResult>): boolean {
  if (result.code === BloggerClientReturnCode.OK) {
    return result.data.status === PostStatus.SoftTrashed;
  }
  const error = (result.response as { error?: { code?: number } } | undefined)?.error;
  return error?.code === 404;
}

export type PostStatusAction = 'publish' | 'revert' | 'none';

/**
 * Blogger's `posts.update` (PUT) does not change a post's status, so a
 * draft/live switch requires the dedicated `posts.publish` / `posts.revert`
 * endpoints.
 */
export function statusChangeAction(target: PostStatus, current?: string): PostStatusAction {
  if (target === PostStatus.Live && current === PostStatus.Draft) {
    return 'publish';
  }
  if (target === PostStatus.Draft && current === PostStatus.Live) {
    return 'revert';
  }
  return 'none';
}
