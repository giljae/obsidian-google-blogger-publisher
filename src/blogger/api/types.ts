import { PostStatus } from '../../core/types';

export const BloggerClientReturnCode = {
  OK: 'OK',
  Error: 'Error',
} as const;
export type BloggerClientReturnCode =
  (typeof BloggerClientReturnCode)[keyof typeof BloggerClientReturnCode];

export interface BloggerPostParams {
  status: PostStatus;
  labels: string[];

  /** Post title. */
  title: string;

  /** Rendered HTML content. */
  content: string;

  /**
   * Blogger post id. When present the post is updated; otherwise a new one
   * is created.
   */
  postId?: string;

  /** Name of the profile that owns the post (from front matter). */
  profileName?: string;
}

export interface BloggerPublishResult {
  postId: string;
  url: string;
  status: PostStatus;
}

export type BloggerClientResult<T> =
  | { code: typeof BloggerClientReturnCode.OK; data: T; response?: unknown }
  | { code: typeof BloggerClientReturnCode.Error; message: string; response?: unknown };

export interface BloggerClient {
  /**
   * Publish the active note. When `defaultPostParams` is provided the publish
   * modal is skipped.
   */
  publishPost(defaultPostParams?: BloggerPostParams): Promise<
    BloggerClientResult<BloggerPublishResult>
  >;
}
