import { requestUrl } from 'obsidian';
import {
  BLOGGER_OAUTH2_SCOPE,
  GOOGLE_OAUTH2_AUTHORIZE_ENDPOINT,
  GOOGLE_OAUTH2_TOKEN_ENDPOINT,
  GOOGLE_OAUTH2_VALIDATE_TOKEN_ENDPOINT,
} from '../../consts';
import { codeChallengeS256 } from './pkce';
import {
  FreshInternalOAuth2Token,
  InternalOAuth2Token,
  isFreshInternalOAuth2Token,
} from './token';

export interface OAuth2Credentials {
  clientId: string;
  clientSecret: string;
}

export interface AuthorizeParams {
  redirectUri: string;
  scope?: string;
  state: string;
  codeVerifier: string;
  blog?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

const TOKEN_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'User-Agent': 'obsidian.md',
};

export class OAuth2Client {
  constructor(private readonly credentials: OAuth2Credentials) {}

  /** Build the Google consent URL for the PKCE flow. */
  async authorizeUrl(params: AuthorizeParams): Promise<string> {
    const query = new URLSearchParams({
      client_id: this.credentials.clientId,
      response_type: 'code',
      redirect_uri: params.redirectUri,
      scope: params.scope ?? BLOGGER_OAUTH2_SCOPE,
      state: params.state,
      access_type: 'offline',
      prompt: 'consent',
      code_challenge_method: 'S256',
      code_challenge: await codeChallengeS256(params.codeVerifier),
    });
    if (params.blog) {
      query.set('blog', params.blog);
    }
    return `${GOOGLE_OAUTH2_AUTHORIZE_ENDPOINT}?${query.toString()}`;
  }

  /** Exchange an authorization code for tokens. */
  exchangeToken(params: {
    code: string;
    redirectUri: string;
    codeVerifier: string;
  }): Promise<FreshInternalOAuth2Token> {
    return this.requestToken(
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
        code: params.code,
        redirect_uri: params.redirectUri,
        code_verifier: params.codeVerifier,
      }),
    );
  }

  /** Refresh an expired token. */
  refreshToken(token: InternalOAuth2Token): Promise<FreshInternalOAuth2Token> {
    return this.requestToken(
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
        refresh_token: token.refreshToken,
      }),
      token.refreshToken,
    );
  }

  /** Return the token if still fresh, otherwise refresh it. */
  ensureFresh(token: InternalOAuth2Token): Promise<FreshInternalOAuth2Token> {
    return isFreshInternalOAuth2Token(token) ? Promise.resolve(token) : this.refreshToken(token);
  }

  /** Verify an access token against Google's tokeninfo endpoint. */
  async validate(accessToken: string): Promise<void> {
    await requestUrl({
      url: `${GOOGLE_OAUTH2_VALIDATE_TOKEN_ENDPOINT}?access_token=${accessToken}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'obsidian.md' },
    });
  }

  private async requestToken(
    body: URLSearchParams,
    fallbackRefreshToken?: string,
  ): Promise<FreshInternalOAuth2Token> {
    const requestTime = Date.now();
    const response = await requestUrl({
      url: GOOGLE_OAUTH2_TOKEN_ENDPOINT,
      method: 'POST',
      headers: TOKEN_HEADERS,
      body: body.toString(),
    });
    const resp = response.json as TokenResponse;
    const expiresIn = Number(resp.expires_in);
    const token: InternalOAuth2Token = {
      accessToken: resp.access_token,
      tokenType: resp.token_type,
      expiresIn,
      expiresAt: requestTime + Math.max(0, expiresIn - 60) * 1000,
      refreshToken: resp.refresh_token ?? fallbackRefreshToken ?? '',
      scope: resp.scope,
    };
    if (!isFreshInternalOAuth2Token(token)) {
      throw new Error('Could not obtain a fresh Google OAuth2 token.');
    }
    return token;
  }
}
