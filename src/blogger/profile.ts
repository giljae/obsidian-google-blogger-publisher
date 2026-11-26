import { InternalOAuth2Token } from './oauth2/token';

export interface BloggerProfile {
  /** Profile name shown in the UI. */
  name: string;

  /** Blog endpoint, e.g. `https://example.blogspot.com`. */
  endpoint: string;

  /** Blogger blog id (resolved from `endpoint`). */
  blogId: string;

  /** Google OAuth2 token for the Blogger scope. */
  googleOAuth2Token: InternalOAuth2Token;

  /** Whether this profile is the default one. */
  isDefault: boolean;
}
