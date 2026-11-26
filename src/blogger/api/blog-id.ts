import { requestUrl } from 'obsidian';
import { BLOGGER_API_ENDPOINT } from '../../consts';
import { InternalOAuth2Token } from '../oauth2/token';

/** Resolve a blog's numeric id from its `.blogspot.com` URL. */
export async function fetchBlogId(
  endpoint: string,
  token: InternalOAuth2Token,
): Promise<string> {
  const url = `${BLOGGER_API_ENDPOINT}/byurl?url=${encodeURIComponent(endpoint)}`;
  const response = await requestUrl({
    url,
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'obsidian.md',
      authorization: `Bearer ${token.accessToken}`,
    },
    throw: false,
  });
  const json = response.json as { id?: string; error?: { message?: string } };
  if (json.error || !json.id) {
    throw new Error(json.error?.message ?? 'Could not resolve the blog id.');
  }
  return json.id;
}

/** A `.blogspot.com` URL is the only kind Blogger's byurl lookup accepts. */
export function isValidBlogspotUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith('.blogspot.com');
  } catch {
    return false;
  }
}
