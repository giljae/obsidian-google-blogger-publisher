import { requestUrl } from 'obsidian';

export type HttpMethod = 'GET' | 'POST' | 'PUT';

/**
 * Thin wrapper around Obsidian's `requestUrl` (which bypasses CORS). Used for
 * the Blogger API; the OAuth2 endpoints are called directly.
 */
export class RestClient {
  constructor(private readonly baseUrl: string) {}

  async request(
    method: HttpMethod,
    path: string,
    options?: { headers?: Record<string, string>; body?: unknown },
  ): Promise<unknown> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const response = await requestUrl({
      url: `${this.baseUrl}/${cleanPath}`,
      method,
      headers: {
        'content-type': 'application/json',
        'user-agent': 'obsidian.md',
        ...options?.headers,
      },
      body: options?.body === undefined ? undefined : JSON.stringify(options.body),
      throw: false,
    });
    return response.json;
  }
}
