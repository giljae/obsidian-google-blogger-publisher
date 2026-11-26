/** Blogger rejects a post whose HTTP request body exceeds 2 MiB with HTTP 400. */
export const BLOGGER_REQUEST_LIMIT = 2_097_152; // 2 MiB

/** Warn once the request body is within ~10% of the hard limit. */
export const DEFAULT_WARN_THRESHOLD = 1_887_437; // ≈ 1.8 MiB

export type BloggerSizeStatus = 'ok' | 'warn' | 'over';

export function measureUtf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

/**
 * Approximate the byte length of the `posts.insert/update` request body for
 * the given post, using the same JSON shape the REST client sends.
 */
export function estimatePostRequestBytes(post: {
  title?: string;
  content: string;
  labels?: string[];
}): number {
  const payload = {
    kind: 'blogger#post',
    title: post.title ?? '',
    content: post.content,
    labels: post.labels ?? [],
  };
  return measureUtf8Bytes(JSON.stringify(payload));
}

export function checkPostSize(
  bytes: number,
  warnThreshold: number = DEFAULT_WARN_THRESHOLD,
  limit: number = BLOGGER_REQUEST_LIMIT,
): BloggerSizeStatus {
  if (bytes > limit) {
    return 'over';
  }
  if (bytes >= warnThreshold) {
    return 'warn';
  }
  return 'ok';
}
